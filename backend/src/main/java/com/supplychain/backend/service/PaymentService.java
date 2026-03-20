package com.supplychain.backend.service;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.Payment;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.entity.ProductRequest;
import com.supplychain.backend.entity.TrackingEvent;
import com.supplychain.backend.repository.BatchRepository;
import com.supplychain.backend.repository.PaymentRepository;
import com.supplychain.backend.repository.NotificationRepository;
import com.supplychain.backend.repository.ProductRequestRepository;
import com.supplychain.backend.repository.TrackingEventRepository;
import com.supplychain.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BatchRepository batchRepository;
    private final UserRepository userRepository;
    private final ProductRequestRepository requestRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final NotificationRepository notificationRepository;

    public Payment createPayment(Payment payment) {
        if (payment.getBatch() == null) {
            throw new RuntimeException("Batch information is missing");
        }
        
        Batch batch;
        if (payment.getBatch().getId() != null) {
            batch = batchRepository.findById(payment.getBatch().getId())
                    .orElseThrow(() -> new RuntimeException("Batch not found by ID!"));
        } else if (payment.getBatch().getBatchCode() != null) {
            batch = batchRepository.findByBatchCode(payment.getBatch().getBatchCode())
                    .orElseThrow(() -> new RuntimeException("Batch not found by code!"));
        } else {
            throw new RuntimeException("Batch ID or Code is required");
        }
        
        // Support for "Money Request" updates: Check if record exists for this ProductRequest
        if (payment.getProductRequest() != null && payment.getProductRequest().getId() != null) {
            final Long reqId = payment.getProductRequest().getId();
            Optional<Payment> existing = paymentRepository.findAll().stream()
                .filter(p -> p.getProductRequest() != null && 
                             p.getProductRequest().getId().equals(reqId) &&
                             "PENDING".equals(p.getPaymentStatus()))
                .findFirst();
            
            if (existing.isPresent()) {
                Payment toUpdate = existing.get();
                // Update amount and wallets just in case
                if (payment.getAmount() != null) toUpdate.setAmount(payment.getAmount());
                if (payment.getCurrency() != null) toUpdate.setCurrency(payment.getCurrency());
                
                // Continue with setting common fields
                payment = toUpdate;
            }
        }

        payment.setBatch(batch);
        payment.setPaymentStatus("PENDING");
        payment.setPaymentDate(LocalDateTime.now());
        
        // Auto-set receiver from batch's current owner if not provided
        if (payment.getReceiver() == null || payment.getReceiver().getId() == null) {
            payment.setReceiver(batch.getCurrentOwner());
        }
        
        // Auto-set wallets and entities from users if available
        if (payment.getPayer() != null && payment.getPayer().getId() != null) {
            User payer = userRepository.findById(payment.getPayer().getId()).orElse(null);
            if (payer != null) {
                payment.setPayer(payer);
                payment.setFromWallet(payer.getWalletAddress());
            }
        }
        
        if (payment.getReceiver() != null && payment.getReceiver().getId() != null) {
            User receiver = userRepository.findById(payment.getReceiver().getId()).orElse(null);
            if (receiver != null) {
                payment.setReceiver(receiver);
                payment.setToWallet(receiver.getWalletAddress());
            }
        }

        return paymentRepository.save(payment);
    }

    public List<Payment> getPaymentsByBatch(Long batchId) {
        return paymentRepository.findByBatchId(batchId);
    }

    public List<Payment> getPaymentsByUser(Long userId) {
        // Find payments where user is either payer or receiver
        List<Payment> payerPayments = paymentRepository.findByPayerId(userId);
        List<Payment> receiverPayments = paymentRepository.findByReceiverId(userId);
        
        payerPayments.addAll(receiverPayments);
        return payerPayments;
    }

    @Transactional
    public Payment confirmPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found!"));
        
        payment.setPaymentStatus("COMPLETED");
        Payment savedPayment = paymentRepository.save(payment);

        // Feature: Automatic Ownership Transfer for Product Requests
        if (payment.getProductRequest() != null) {
            ProductRequest req = payment.getProductRequest();
            req.setIsPaid(true);
            requestRepository.save(req);

            Batch batch = payment.getBatch();
            User previousOwner = batch.getCurrentOwner();
            User requester = req.getRequester();
            BigDecimal requestedQty = req.getQuantityRequested();
            BigDecimal availableQty = batch.getQuantityKg();

            if (requestedQty.compareTo(availableQty) < 0) {
                // PARTIAL PURCHASE: Split the batch
                Batch newBatch = new Batch();
                newBatch.setProductName(batch.getProductName());
                newBatch.setFarmer(batch.getFarmer());
                newBatch.setFarm(batch.getFarm());
                newBatch.setPricePerKg(batch.getPricePerKg());
                newBatch.setQualityGrade(batch.getQualityGrade());
                newBatch.setHarvestDate(batch.getHarvestDate());
                newBatch.setExpiryDate(batch.getExpiryDate());
                newBatch.setDescription(batch.getDescription());
                newBatch.setQuantityKg(requestedQty);
                newBatch.setCurrentOwner(requester);
                newBatch.setStatus("READY_TO_DISPATCH");
                
                // Generate split code
                String splitCode = batch.getBatchCode() + "-P" + (System.currentTimeMillis() % 1000);
                newBatch.setBatchCode(splitCode);
                
                Batch savedNewBatch = batchRepository.save(newBatch);
                
                // Reduce original batch quantity
                batch.setQuantityKg(availableQty.subtract(requestedQty));
                batchRepository.save(batch);

                // Record split event on original batch
                TrackingEvent splitEvent = new TrackingEvent();
                splitEvent.setBatch(batch);
                splitEvent.setEventType("BATCH_SPLIT");
                splitEvent.setFromUser(batch.getFarmer());
                splitEvent.setToUser(requester);
                splitEvent.setNotes("Split off " + requestedQty + " KG for request #" + req.getId() + ". Remaining: " + batch.getQuantityKg() + " KG.");
                splitEvent.setEventTimestamp(LocalDateTime.now());
                trackingEventRepository.save(splitEvent);
                
                // Update relationships
                req.setBatch(savedNewBatch);
                requestRepository.save(req);
                payment.setBatch(savedNewBatch);
                paymentRepository.save(payment);
                
                // --- Inherit History from Parent Batch ---
                try {
                    List<TrackingEvent> originalHistory = trackingEventRepository.findByBatchId(batch.getId());
                    for (TrackingEvent oldEvent : originalHistory) {
                        TrackingEvent inheritedEvent = new TrackingEvent();
                        inheritedEvent.setBatch(savedNewBatch);
                        inheritedEvent.setEventType(oldEvent.getEventType());
                        inheritedEvent.setFromUser(oldEvent.getFromUser());
                        inheritedEvent.setToUser(oldEvent.getToUser());
                        inheritedEvent.setLocation(oldEvent.getLocation());
                        inheritedEvent.setLatitude(oldEvent.getLatitude());
                        inheritedEvent.setLongitude(oldEvent.getLongitude());
                        inheritedEvent.setTemperatureCelsius(oldEvent.getTemperatureCelsius());
                        inheritedEvent.setNotes(oldEvent.getNotes() != null ? oldEvent.getNotes() + " (Inherited from parent batch " + batch.getBatchCode() + ")" : "Inherited from parent");
                        inheritedEvent.setBlockchainTxHash(oldEvent.getBlockchainTxHash());
                        inheritedEvent.setEventTimestamp(oldEvent.getEventTimestamp());
                        trackingEventRepository.save(inheritedEvent);
                    }
                } catch (Exception e) {
                    System.err.println("Failed to inherit history: " + e.getMessage());
                }

                // Tracking for the new portion
                TrackingEvent event = new TrackingEvent();
                event.setBatch(savedNewBatch);
                event.setEventType("OWNERSHIP_TRANSFERRED");
                event.setFromUser(previousOwner);
                event.setToUser(requester);
                event.setNotes("Partial purchase for request #" + req.getId() + ". Status: READY_TO_DISPATCH.");
                event.setEventTimestamp(LocalDateTime.now());
                trackingEventRepository.save(event);
            } else {
                // FULL PURCHASE: Transfer entire batch
                batch.setCurrentOwner(requester);
                batch.setStatus("READY_TO_DISPATCH");
                batchRepository.save(batch);

                // Record tracking event
                TrackingEvent event = new TrackingEvent();
                event.setBatch(batch);
                event.setEventType("OWNERSHIP_TRANSFERRED");
                event.setFromUser(previousOwner);
                event.setToUser(requester);
                event.setNotes("Payment confirmed for request #" + req.getId() + ". Status: READY_TO_DISPATCH.");
                event.setEventTimestamp(LocalDateTime.now());
                trackingEventRepository.save(event);
            }

            // Send notifications
            try {
                com.supplychain.backend.entity.Notification buyerNote = new com.supplychain.backend.entity.Notification();
                buyerNote.setUser(requester);
                buyerNote.setTitle("Ownership Transferred");
                buyerNote.setMessage("Payment confirmed for request #" + req.getId() + ". You are now the owner. Status: READY_TO_DISPATCH.");
                buyerNote.setType("SUCCESS");
                buyerNote.setCategory("PAYMENT");
                notificationRepository.save(buyerNote);

                com.supplychain.backend.entity.Notification sellerNote = new com.supplychain.backend.entity.Notification();
                sellerNote.setUser(previousOwner);
                sellerNote.setTitle("Product Sold");
                sellerNote.setMessage("Payment received for request #" + req.getId() + ". Batch is now READY_TO_DISPATCH.");
                sellerNote.setType("INFO");
                sellerNote.setCategory("PAYMENT");
                notificationRepository.save(sellerNote);

                // Notify Transporter if assigned
                if (req.getTransporter() != null) {
                    com.supplychain.backend.entity.Notification transNote = new com.supplychain.backend.entity.Notification();
                    transNote.setUser(req.getTransporter());
                    transNote.setTitle("Logistics Job Ready");
                    transNote.setMessage("Payment completed for trade between " + previousOwner.getFullName() + " and " + requester.getFullName() + ". Batch " + batch.getProductName() + " is now READY_TO_DISPATCH.");
                    transNote.setType("SUCCESS");
                    transNote.setCategory("LOGISTICS");
                    notificationRepository.save(transNote);
                }
            } catch (Exception e) {
                System.err.println("Failed to send transfer notification: " + e.getMessage());
            }
        }

        return savedPayment;
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}
