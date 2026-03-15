package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/farmer/{id}")
    public ResponseEntity<ApiResponse> getFarmerStats(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", statsService.getFarmerStats(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/transporter/{id}")
    public ResponseEntity<ApiResponse> getTransporterStats(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", statsService.getTransporterStats(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/retailer/{id}")
    public ResponseEntity<ApiResponse> getRetailerStats(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", statsService.getRetailerStats(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse> getAdminStats() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", statsService.getAdminStats()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
