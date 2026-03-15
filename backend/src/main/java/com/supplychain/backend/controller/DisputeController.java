package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Dispute;
import com.supplychain.backend.repository.DisputeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/dispute")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DisputeController {

    private final DisputeRepository disputeRepository;

    @PostMapping
    public ResponseEntity<ApiResponse> createDispute(@RequestBody Dispute dispute) {
        try {
            Dispute savedDispute = disputeRepository.save(dispute);
            return ResponseEntity.ok(ApiResponse.success("Dispute created successfully", savedDispute));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/batch/{batchId}")
    public ResponseEntity<ApiResponse> getDisputesByBatch(@PathVariable Long batchId) {
        try {
            List<Dispute> disputes = disputeRepository.findByBatchId(batchId);
            return ResponseEntity.ok(ApiResponse.success("Disputes fetched successfully", disputes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse> resolveDispute(@PathVariable Long id, @RequestBody(required = false) Dispute resolutionDetails) {
        try {
            Optional<Dispute> optionalDispute = disputeRepository.findById(id);
            if (optionalDispute.isPresent()) {
                Dispute dispute = optionalDispute.get();
                dispute.setStatus("RESOLVED");
                dispute.setResolvedAt(LocalDateTime.now());
                
                if (resolutionDetails != null && resolutionDetails.getResolution() != null) {
                    dispute.setResolution(resolutionDetails.getResolution());
                }
                
                Dispute updatedDispute = disputeRepository.save(dispute);
                return ResponseEntity.ok(ApiResponse.success("Dispute resolved successfully", updatedDispute));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Dispute not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse> getDisputesByUser(@PathVariable Long userId) {
        try {
            List<Dispute> disputes = disputeRepository.findByRaisedById(userId);
            return ResponseEntity.ok(ApiResponse.success("Disputes fetched successfully", disputes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllDisputes() {
        try {
            List<Dispute> disputes = disputeRepository.findAll();
            return ResponseEntity.ok(ApiResponse.success("All disputes fetched successfully", disputes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
