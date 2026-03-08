package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Farm;
import com.supplychain.backend.service.FarmService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/farm")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FarmController {

    private final FarmService farmService;

    // Get all farms
    @GetMapping
    public ResponseEntity<ApiResponse> getAllFarms() {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", farmService.getAllFarms())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get farm by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getFarmById(@PathVariable Long id) {
        try {
            Farm farm = farmService.getFarmById(id)
                    .orElseThrow(() -> new RuntimeException("Farm not found!"));
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", farm)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get farms by farmer
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<ApiResponse> getFarmsByFarmer(@PathVariable Long farmerId) {
        try {
            return ResponseEntity.ok(
                new ApiResponse(true, "Success",
                    farmService.getFarmsByFarmer(farmerId))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Create new farm
    @PostMapping
    public ResponseEntity<ApiResponse> createFarm(@RequestBody Farm farm) {
        try {
            Farm savedFarm = farmService.createFarm(farm);
            return ResponseEntity.ok(
                new ApiResponse(true, "Farm created successfully!", savedFarm)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Update farm
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateFarm(
            @PathVariable Long id,
            @RequestBody Farm updatedFarm) {
        try {
            Farm farm = farmService.updateFarm(id, updatedFarm);
            return ResponseEntity.ok(
                new ApiResponse(true, "Farm updated successfully!", farm)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Delete farm
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteFarm(@PathVariable Long id) {
        try {
            farmService.deleteFarm(id);
            return ResponseEntity.ok(
                new ApiResponse(true, "Farm deleted successfully!")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
