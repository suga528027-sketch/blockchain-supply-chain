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
                newBatch.setStatus("PURCHASED");
                
                // Generate split code
                String splitCode = batch.getBatchCode() + "-P" + (System.currentTimeMillis() % 1000);
                newBatch.setBatchCode(splitCode);
                
                Batch savedNewBatch = batchRepository.save(newBatch);
                
                // Reduce original batch quantity
                batch.setQuantityKg(availableQty.subtract(requestedQty));
                batchRepository.save(batch);
                
                // Update relationships
                req.setBatch(savedNewBatch);
                requestRepository.save(req);
                payment.setBatch(savedNewBatch);
                paymentRepository.save(payment);

                // Tracking for the new portion
                TrackingEvent event = new TrackingEvent();
                event.setBatch(savedNewBatch);
                event.setEventType("OWNERSHIP_TRANSFERRED");
                event.setFromUser(previousOwner);
                event.setToUser(requester);
                event.setNotes("Partial purchase for request #" + req.getId() + ". Split from original batch " + batch.getBatchCode());
                event.setEventTimestamp(LocalDateTime.now());
                trackingEventRepository.save(event);
            } else {
                // FULL PURCHASE: Transfer entire batch
                batch.setCurrentOwner(requester);
                batch.setStatus("PURCHASED");
                batchRepository.save(batch);

                // Record tracking event
                TrackingEvent event = new TrackingEvent();
                event.setBatch(batch);
                event.setEventType("OWNERSHIP_TRANSFERRED");
                event.setFromUser(previousOwner);
                event.setToUser(requester);
                event.setNotes("Automated ownership transfer upon successful payment for request #" + req.getId());
                event.setEventTimestamp(LocalDateTime.now());
                trackingEventRepository.save(event);
            }

            // Send notifications
            try {
                com.supplychain.backend.entity.Notification buyerNote = new com.supplychain.backend.entity.Notification();
                buyerNote.setUser(requester);
                buyerNote.setTitle("Ownership Transferred");
                buyerNote.setMessage("Payment confirmed for request #" + req.getId() + ". You are now the owner of " + batch.getProductName() + ".");
                buyerNote.setType("SUCCESS");
                notificationRepository.save(buyerNote);

                com.supplychain.backend.entity.Notification sellerNote = new com.supplychain.backend.entity.Notification();
                sellerNote.setUser(previousOwner);
                sellerNote.setTitle("Product Sold");
                sellerNote.setMessage("Payment received for request #" + req.getId() + ". Ownership of " + batch.getProductName() + " has been transferred to " + requester.getFullName() + ".");
                sellerNote.setType("INFO");
                notificationRepository.save(sellerNote);
            } catch (Exception e) {
                System.err.println("Failed to send transfer notification: " + e.getMessage());
            }
        }

        return savedPayment;
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }
}
