package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.Notification;
import com.supplychain.backend.entity.ProductRequest;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.repository.BatchRepository;
import com.supplychain.backend.repository.NotificationRepository;
import com.supplychain.backend.repository.ProductRequestRepository;
import com.supplychain.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
                    Notification notification = new Notification();
                    notification.setUser(owner);
                    notification.setTitle("New Product Request");
                    notification.setMessage(requester.getFullName() + " has requested " + 
                        productRequest.getQuantityRequested() + " KG of " + batch.getProductName() + 
                        " (Batch: " + batch.getBatchCode() + ")");
                    notification.setType("INFO");
                    notificationRepository.save(notification);
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
                    if (b != null && b.getPricePerKg() != null) {
                        req.setTotalPrice(b.getPricePerKg().multiply(req.getQuantityRequested()));
                    }
                }
                requestRepository.save(req);
                
                // Send notification to the requester
                try {
                    User owner = userRepository.findById(req.getOwner().getId()).orElse(null);
                    User requester = userRepository.findById(req.getRequester().getId()).orElse(null);
                    Batch batch = batchRepository.findById(req.getBatch().getId()).orElse(null);
                    
                    if (owner != null && requester != null && batch != null) {
                        Notification notification = new Notification();
                        notification.setUser(requester);
                        notification.setTitle("Product Request " + status);
                        String msg = "Your request for " + req.getQuantityRequested() + " KG of " + 
                            batch.getProductName() + " has been " + status.toLowerCase() + " by " + owner.getFullName();
                        
                        if (status.equals("ACCEPTED") && req.getTotalPrice() != null) {
                            msg += ". Total amount to pay: ₹" + req.getTotalPrice() + ". Please make payment to trigger stock transfer.";
                        }
                        
                        notification.setMessage(msg);
                        notification.setType(status.equals("ACCEPTED") ? "SUCCESS" : "ERROR");
                        notificationRepository.save(notification);
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
