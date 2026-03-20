package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.service.BatchService;
import com.supplychain.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/transport")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransportController {

    private final BatchService batchService;
    private final PaymentService paymentService;

    // Get batches assigned to this transporter
    @GetMapping("/assigned/{transporterId}")
    public ResponseEntity<ApiResponse> getAssignedBatches(@PathVariable Long transporterId) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Success", 
                batchService.getBatchesByOwner(transporterId)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Transporter accepts batch (might be redundant if already transferred, but let's implement if needed or just return success)
    @PutMapping("/{batchId}/accept")
    public ResponseEntity<ApiResponse> acceptBatch(@PathVariable Long batchId) {
        try {
            // Implementation can just update status in batchService if required or just acknowledge
            Batch batch = batchService.getBatchById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
            if (!batch.getStatus().equals("IN_TRANSIT")) {
                batch.setStatus("IN_TRANSIT");
                batchService.updateBatch(batchId, batch);
                
                // Record tracking event
                batchService.addEvent(batch, "TRANSPORTER_ACCEPTED", "Transporter has accepted the shipment and is moving to destination", null, batch.getCurrentOwner());
            }
            return ResponseEntity.ok(ApiResponse.success("Batch accepted", batch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Update current location of batch
    @PutMapping("/{batchId}/update-location")
    public ResponseEntity<ApiResponse> updateLocation(
            @PathVariable Long batchId,
            @RequestBody Map<String, String> payload) {
        try {
            String location = payload.get("location");
            String notes = payload.get("notes");
            
            // Re-using transferOwnership event logging logic without changing owner
            Batch batch = batchService.getBatchById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
                
            batchService.transferOwnership(batchId, batch.getCurrentOwner().getId(), location, notes, null, null);
            
            return ResponseEntity.ok(ApiResponse.success("Location updated successfully!", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Mark batch as delivered to retailer
    @PutMapping("/{batchId}/deliver/{retailerId}")
    public ResponseEntity<ApiResponse> deliverToRetailer(
            @PathVariable Long batchId,
            @PathVariable Long retailerId) {
        try {
            Batch batch = batchService.confirmDelivery(batchId, retailerId, null, null);
            return ResponseEntity.ok(ApiResponse.success("Batch delivered to retailer", batch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // View transport payments received
    @GetMapping("/{transporterId}/payments")
    public ResponseEntity<ApiResponse> getTransportPayments(@PathVariable Long transporterId) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Success", 
                paymentService.getPaymentsByUser(transporterId).stream()
                    .filter(p -> "TRANSPORT_PAYMENT".equals(p.getPaymentType()))
                    .toList()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
