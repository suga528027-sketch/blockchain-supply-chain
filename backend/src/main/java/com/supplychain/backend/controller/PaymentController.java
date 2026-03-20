package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Payment;
import com.supplychain.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.supplychain.backend.entity.User;
import com.supplychain.backend.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;

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

    @GetMapping
    public ResponseEntity<ApiResponse> getAllPayments() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            if ("ADMIN".equals(currentUser.getRole())) {
                // Admin can view all payments - we use all payments by user ID as a base, or we can use paymentService.getAllPayments() if it exists.
                return ResponseEntity.ok(ApiResponse.success(
                    "Success", 
                    paymentService.getAllPayments()
                ));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error("Unauthorized"));
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
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User currentUser = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            List<Payment> payments = paymentService.getPaymentsByUser(userId);

            if ("FARMER".equals(currentUser.getRole())) {
                // Farmer can only view received payments
                payments = payments.stream()
                        .filter(p -> p.getReceiver() != null && p.getReceiver().getId().equals(currentUser.getId()))
                        .toList();
            } else if ("TRANSPORTER".equals(currentUser.getRole())) {
                // Transporter can only view transport payments
                payments = payments.stream()
                        .filter(p -> "TRANSPORT_PAYMENT".equals(p.getPaymentType()) && p.getReceiver() != null && p.getReceiver().getId().equals(currentUser.getId()))
                        .toList();
            } else if ("RETAILER".equals(currentUser.getRole())) {
                // Retailer can view all payments made by them
                payments = payments.stream()
                        .filter(p -> p.getPayer() != null && p.getPayer().getId().equals(currentUser.getId()))
                        .toList();
            } else if (!"ADMIN".equals(currentUser.getRole()) && !currentUser.getId().equals(userId)) {
                // Make sure users can't fetch others' payments unless admin
                throw new RuntimeException("Unauthorized");
            }
            
            return ResponseEntity.ok(ApiResponse.success(
                "Success", 
                payments
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
