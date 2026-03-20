package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.Payment;
import com.supplychain.backend.service.BatchService;
import com.supplychain.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/retail")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RetailController {

    private final BatchService batchService;
    private final PaymentService paymentService;

    // Get batches assigned to retailer
    @GetMapping("/batches/{retailerId}")
    public ResponseEntity<ApiResponse> getRetailBatches(@PathVariable Long retailerId) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Success", 
                batchService.getBatchesByOwner(retailerId)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Accept batch from transporter (might just update status)
    @PutMapping("/{batchId}/accept")
    public ResponseEntity<ApiResponse> acceptBatch(@PathVariable Long batchId) {
        try {
            Batch batch = batchService.getBatchById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
            batch.setStatus("ACCEPTED_BY_RETAILER");
            batchService.updateBatch(batchId, batch);
            
            // Record tracking event
            batchService.addEvent(batch, "ACCEPTED_BY_RETAILER", "Retailer has received and accepted the batch physical custody", null, batch.getCurrentOwner());
            
            return ResponseEntity.ok(ApiResponse.success("Batch accepted", batch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Confirm final delivery
    @PutMapping("/{batchId}/confirm-delivery")
    public ResponseEntity<ApiResponse> confirmDelivery(@PathVariable Long batchId) {
        try {
            Batch batch = batchService.getBatchById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
            batch.setStatus("DELIVERED_FINAL");
            batchService.updateBatch(batchId, batch);
            
            // Record tracking event
            batchService.addEvent(batch, "DELIVERED_FINAL", "Final delivery confirmed by retailer at the destination node", null, batch.getCurrentOwner());
            
            return ResponseEntity.ok(ApiResponse.success("Final delivery confirmed", batch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Make payment to farmer
    @PostMapping("/pay/farmer")
    public ResponseEntity<ApiResponse> payFarmer(@RequestBody Map<String, Object> payload) {
        try {
            Long batchId = Long.valueOf(payload.get("batchId").toString());
            Long farmerId = Long.valueOf(payload.get("farmerId").toString());
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            
            Batch batch = batchService.getBatchById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
                
            Payment payment = new Payment();
            payment.setBatch(batch);
            payment.setAmount(amount);
            payment.setPaymentType("PRODUCE_PAYMENT");
            
            com.supplychain.backend.entity.User farmer = new com.supplychain.backend.entity.User();
            farmer.setId(farmerId);
            payment.setReceiver(farmer);
            
            // Assume the currently logged in retailer is the payer, or maybe pass retailerId
            
            Payment created = paymentService.createPayment(payment);
            return ResponseEntity.ok(ApiResponse.success("Payment to farmer successful", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Make payment to transporter
    @PostMapping("/pay/transporter")
    public ResponseEntity<ApiResponse> payTransporter(@RequestBody Map<String, Object> payload) {
        try {
            Long batchId = Long.valueOf(payload.get("batchId").toString());
            Long transporterId = Long.valueOf(payload.get("transporterId").toString());
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            
            Batch batch = batchService.getBatchById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
                
            Payment payment = new Payment();
            payment.setBatch(batch);
            payment.setAmount(amount);
            payment.setPaymentType("TRANSPORT_PAYMENT");
            
            com.supplychain.backend.entity.User transporter = new com.supplychain.backend.entity.User();
            transporter.setId(transporterId);
            payment.setReceiver(transporter);
            
            Payment created = paymentService.createPayment(payment);
            return ResponseEntity.ok(ApiResponse.success("Payment to transporter successful", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // View all payments made
    @GetMapping("/{retailerId}/payments")
    public ResponseEntity<ApiResponse> getPaymentsMade(@PathVariable Long retailerId) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Success", 
                paymentService.getPaymentsByUser(retailerId).stream()
                    .filter(p -> p.getPayer() != null && p.getPayer().getId().equals(retailerId))
                    .toList()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
