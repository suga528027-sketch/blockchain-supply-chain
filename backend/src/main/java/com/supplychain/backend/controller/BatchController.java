package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.service.BatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BatchController {

    private final BatchService batchService;

    // Get all batches
    @GetMapping
    public ResponseEntity<ApiResponse> getAllBatches() {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", batchService.getAllBatches())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get batch by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getBatchById(@PathVariable Long id) {
        try {
            Batch batch = batchService.getBatchById(id)
                    .orElseThrow(() -> new RuntimeException("Batch not found!"));
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", batch)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get batch by batch code (Public - for QR scanning)
    @GetMapping("/track/{batchCode}")
    public ResponseEntity<ApiResponse> getBatchByCode(@PathVariable String batchCode) {
        try {
            Batch batch = batchService.getBatchByCode(batchCode)
                    .orElseThrow(() -> new RuntimeException("Batch not found!"));
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", batch)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get batches by farmer
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<ApiResponse> getBatchesByFarmer(@PathVariable Long farmerId) {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success",
                    batchService.getBatchesByFarmer(farmerId))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Create new batch
    @PostMapping
    public ResponseEntity<ApiResponse> createBatch(@RequestBody Batch batch) {
        try {
            Batch savedBatch = batchService.createBatch(batch);
            return ResponseEntity.ok(
                new ApiResponse(true, "Batch created successfully!", savedBatch)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Transfer batch ownership
    @PutMapping("/{batchId}/transfer/{newOwnerId}")
    public ResponseEntity<ApiResponse> transferOwnership(
            @PathVariable Long batchId,
            @PathVariable Long newOwnerId,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String notes) {
        try {
            Batch batch = batchService.transferOwnership(
                batchId, newOwnerId, location, notes);
            return ResponseEntity.ok(
                new ApiResponse(true, "Ownership transferred successfully!", batch)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Confirm delivery
    @PutMapping("/{batchId}/deliver/{retailerId}")
    public ResponseEntity<ApiResponse> confirmDelivery(
            @PathVariable Long batchId,
            @PathVariable Long retailerId) {
        try {
            Batch batch = batchService.confirmDelivery(batchId, retailerId);
            return ResponseEntity.ok(
                new ApiResponse(true, "Delivery confirmed successfully!", batch)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get tracking history
    @GetMapping("/{batchId}/history")
    public ResponseEntity<ApiResponse> getTrackingHistory(@PathVariable Long batchId) {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success",
                    batchService.getBatchTrackingHistory(batchId))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Delete batch
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBatch(@PathVariable Long id) {
        try {
            batchService.deleteBatch(id);
            return ResponseEntity.ok(
                new ApiResponse(true, "Batch deleted successfully!")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
}