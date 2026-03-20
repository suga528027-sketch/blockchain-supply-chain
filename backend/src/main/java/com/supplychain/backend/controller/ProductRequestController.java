package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.Notification;
import com.supplychain.backend.entity.ProductRequest;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.repository.BatchRepository;
import com.supplychain.backend.repository.NotificationRepository;
import com.supplychain.backend.repository.ProductRequestRepository;
import com.supplychain.backend.repository.TrackingEventRepository;
import com.supplychain.backend.entity.TrackingEvent;
import com.supplychain.backend.repository.UserRepository;
import com.supplychain.backend.service.PaymentService;
import com.supplychain.backend.entity.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Optional;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductRequestController {

    private final ProductRequestRepository requestRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final PaymentService paymentService;
    private final TrackingEventRepository trackingEventRepository;

    // Create a new request
    @PostMapping
    public ResponseEntity<ApiResponse> createRequest(@RequestBody ProductRequest productRequest) {
        try {
            ProductRequest savedReq = requestRepository.save(productRequest);
            
            // Send notification to the owner
            try {
                User requester = userRepository.findById(productRequest.getRequester().getId()).orElse(null);
                User owner = userRepository.findById(productRequest.getOwner().getId()).orElse(null);
                Batch batch = batchRepository.findById(productRequest.getBatch().getId()).orElse(null);
                
                if (requester != null && owner != null && batch != null) {
                    // Record tracking event for the request
                    TrackingEvent reqEvent = new TrackingEvent();
                    reqEvent.setBatch(batch);
                    reqEvent.setEventType("TRADE_REQUESTED");
                    reqEvent.setFromUser(requester);
                    reqEvent.setToUser(owner);
                    reqEvent.setNotes("Retailer requested " + productRequest.getQuantityRequested() + " KG. Status: PENDING.");
                    trackingEventRepository.save(reqEvent);

                    // Notify Farmer (Owner)
                    Notification farmerNotif = new Notification();
                    farmerNotif.setUser(owner);
                    farmerNotif.setTitle("New Trade Request");
                    farmerNotif.setMessage(requester.getFullName() + " wants to buy " + 
                        productRequest.getQuantityRequested() + " KG of " + batch.getProductName());
                    farmerNotif.setType("INFO");
                    farmerNotif.setCategory("REQUEST");
                    notificationRepository.save(farmerNotif);

                    // Notify Transporter if assigned
                    if (productRequest.getTransporter() != null && productRequest.getTransporter().getId() != null) {
                        User transporter = userRepository.findById(productRequest.getTransporter().getId()).orElse(null);
                        if (transporter != null) {
                            Notification transNotif = new Notification();
                            transNotif.setUser(transporter);
                            transNotif.setTitle("Pending Logistics Job");
                            transNotif.setMessage("You have been assigned as transporter for a new trade between " + 
                                owner.getFullName() + " and " + requester.getFullName() + ". Status: Awaiting Farmer Approval.");
                            transNotif.setType("INFO");
                            transNotif.setCategory("LOGISTICS");
                            notificationRepository.save(transNotif);
                        }
                    }
                }
            } catch (Exception notifyEx) {
                // Don't fail the request if notification fails
                System.err.println("Failed to send notification: " + notifyEx.getMessage());
            }

            return ResponseEntity.ok(
                new ApiResponse(true, "Request sent successfully!", savedReq)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get requests sent by user
    @GetMapping("/sent/{userId}")
    public ResponseEntity<ApiResponse> getSentRequests(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", requestRepository.findByRequesterId(userId))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get requests received by user
    @GetMapping("/received/{userId}")
    public ResponseEntity<ApiResponse> getReceivedRequests(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", requestRepository.findByOwnerId(userId))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get request by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getRequestById(@PathVariable Long id) {
        try {
            return requestRepository.findById(id)
                .map(req -> ResponseEntity.ok(ApiResponse.success("Success", req)))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Get requests assigned to transporter
    @GetMapping("/transporter/{userId}")
    public ResponseEntity<ApiResponse> getTransporterRequests(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", requestRepository.findByTransporterId(userId))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Update request status (Accept/Reject)
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Optional<ProductRequest> reqOpt = requestRepository.findById(id);
            if (reqOpt.isPresent()) {
                ProductRequest req = reqOpt.get();
                req.setStatus(status);
                
                if (status.equals("ACCEPTED")) {
                    Batch b = batchRepository.findById(req.getBatch().getId()).orElse(null);
                    if (b != null) {
                        // Record tracking event for acceptance
                        TrackingEvent accEvent = new TrackingEvent();
                        accEvent.setBatch(b);
                        accEvent.setEventType("TRADE_ACCEPTED");
                        accEvent.setFromUser(req.getOwner());
                        accEvent.setToUser(req.getRequester());
                        accEvent.setNotes("Farmer accepted trade for " + req.getQuantityRequested() + " KG. Awaiting Payment.");
                        trackingEventRepository.save(accEvent);

                        BigDecimal totalPrice = BigDecimal.ZERO;
                        if (b.getPricePerKg() != null) {
                            totalPrice = b.getPricePerKg().multiply(req.getQuantityRequested());
                            req.setTotalPrice(totalPrice);
                        }
                        
                        // 1. Create Produce Payment record (Retailer -> Farmer)
                        try {
                            Payment prodPay = new Payment();
                            prodPay.setBatch(b);
                            prodPay.setProductRequest(req);
                            prodPay.setPayer(req.getRequester());
                            prodPay.setReceiver(req.getOwner());
                            prodPay.setAmount(totalPrice);
                            prodPay.setPaymentType("PRODUCE_PAYMENT");
                            prodPay.setPaymentStatus("PENDING");
                            paymentService.createPayment(prodPay);
                            
                            // 2. Create Transport Payment record (Retailer -> Transporter) if assigned
                            if (req.getTransporter() != null) {
                                Payment transPay = new Payment();
                                transPay.setBatch(b);
                                transPay.setProductRequest(req);
                                transPay.setPayer(req.getRequester());
                                transPay.setReceiver(req.getTransporter());
                                transPay.setAmount(new BigDecimal("500.00")); // Flat orchestration fee
                                transPay.setPaymentType("TRANSPORT_PAYMENT");
                                transPay.setPaymentStatus("PENDING");
                                paymentService.createPayment(transPay);
                            }
                        } catch (Exception payEx) { 
                            System.err.println("Auto-payment creation failed: " + payEx.getMessage());
                        }
                    }
                }
                
                requestRepository.save(req);
                
                // Send notifications
                try {
                    User owner = userRepository.findById(req.getOwner().getId()).orElse(null);
                    User requester = userRepository.findById(req.getRequester().getId()).orElse(null);
                    Batch batch = batchRepository.findById(req.getBatch().getId()).orElse(null);
                    
                    if (owner != null && requester != null && batch != null) {
                        // Notify Requester
                        Notification requesterNotif = new Notification();
                        requesterNotif.setUser(requester);
                        requesterNotif.setTitle("Product Request " + status);
                        String msg = "Your request for " + req.getQuantityRequested() + " KG of " + 
                            batch.getProductName() + " has been " + status.toLowerCase() + " by " + owner.getFullName();
                        
                        if (status.equals("ACCEPTED") && req.getTotalPrice() != null) {
                            msg += ". Total amount to pay: ₹" + req.getTotalPrice() + ". Please make payment to trigger stock transfer.";
                        }
                        
                        requesterNotif.setMessage(msg);
                        requesterNotif.setType(status.equals("ACCEPTED") ? "SUCCESS" : "ERROR");
                        requesterNotif.setCategory("REQUEST");
                        notificationRepository.save(requesterNotif);
                        
                        // Notify Transporter if assigned and request accepted
                        if (req.getTransporter() != null) {
                            Notification transporterNotif = new Notification();
                            transporterNotif.setUser(req.getTransporter());
                            transporterNotif.setTitle("Logistics Job Update");
                            String transMsg = "The trade request for " + batch.getProductName() + " has been " + status.toLowerCase();
                            if (status.equals("ACCEPTED")) {
                                transMsg += ". Status: Awaiting Payment. Transporter will be notified once ready for dispatch.";
                            }
                            transporterNotif.setMessage(transMsg);
                            transporterNotif.setType("INFO");
                            transporterNotif.setCategory("LOGISTICS");
                            notificationRepository.save(transporterNotif);
                        }
                    }
                } catch (Exception notifyEx) {
                    System.err.println("Failed to send notification: " + notifyEx.getMessage());
                }

                return ResponseEntity.ok(
                    new ApiResponse(true, "Status updated to " + status + " successfully!", req)
                );
            } else {
                return ResponseEntity.status(404)
                    .body(new ApiResponse(false, "Request not found!"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
