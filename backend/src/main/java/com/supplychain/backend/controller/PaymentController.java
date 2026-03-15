package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Payment;
import com.supplychain.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<ApiResponse> createPayment(@RequestBody Payment payment) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Payment initiated successfully", 
                paymentService.createPayment(payment)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/batch/{batchId}")
    public ResponseEntity<ApiResponse> getPaymentsByBatch(@PathVariable Long batchId) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Success", 
                paymentService.getPaymentsByBatch(batchId)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse> getPaymentsByUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Success", 
                paymentService.getPaymentsByUser(userId)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse> confirmPayment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                "Payment confirmed successfully", 
                paymentService.confirmPayment(id)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
