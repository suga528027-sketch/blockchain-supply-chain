package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/blockchain")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlockchainController {

    private final BlockchainService blockchainService;

    @PostMapping("/record")
    public ResponseEntity<ApiResponse> recordBatch(@RequestBody Map<String, Object> request) {
        try {
            String batchCode = (String) request.get("batchCode");
            String productName = (String) request.get("productName");
            Long farmerId = Long.valueOf(request.get("farmerId").toString());

            String txHash = blockchainService.recordBatchOnBlockchain(batchCode, productName, farmerId);
            return ResponseEntity.ok(ApiResponse.success("Batch successfully recorded on blockchain", txHash));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/verify/{txHash}")
    public ResponseEntity<ApiResponse> verifyTransaction(@PathVariable String txHash) {
        try {
            boolean isVerified = blockchainService.verifyBatchOnBlockchain(txHash);
            if (isVerified) {
                return ResponseEntity.ok(ApiResponse.success("Transaction verified on Sepolia network", true));
            } else {
                return ResponseEntity.ok(ApiResponse.success("Transaction not found or pending", false));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
