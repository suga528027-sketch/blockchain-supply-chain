package com.supplychain.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.Payment;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.repository.BatchRepository;
import com.supplychain.backend.repository.PaymentRepository;
import com.supplychain.backend.repository.UserRepository;
import com.supplychain.backend.repository.TrackingEventRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final BatchRepository batchRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final TrackingEventRepository trackingEventRepository;

    public Map<String, Object> getFarmerStats(Long farmerId) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found!"));

        List<Batch> batches = batchRepository.findByFarmer(farmer);
        List<Payment> payments = paymentRepository.findByReceiverId(farmerId).stream()
                .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                .collect(Collectors.toList());

        Map<String, BigDecimal> monthlyRevenue = getMonthlyData(payments);
        Map<String, BigDecimal> monthlyProduction = getMonthlyBatchData(batches);

        Map<String, Object> stats = new HashMap<>();
        stats.put("monthlyRevenue", monthlyRevenue);
        stats.put("monthlyProduction", monthlyProduction);
        stats.put("totalBatches", batches.size());
        stats.put("totalRevenue", payments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));

        return stats;
    }

    public Map<String, Object> getTransporterStats(Long transporterId) {
        User transporter = userRepository.findById(transporterId)
                .orElseThrow(() -> new RuntimeException("Transporter not found!"));

        // For transporter, we look at batches where they are the current owner or involved in tracking
        List<Batch> currentBatches = batchRepository.findByCurrentOwner(transporter);
        
        // Simplified: just return count for now, could be expanded with TrackingEvent data
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeShipments", currentBatches.size());
        stats.put("monthlyShipments", new HashMap<String, Integer>()); // Placeholder for complex grouping
        
        return stats;
    }

    public Map<String, Object> getRetailerStats(Long retailerId) {
        User retailer = userRepository.findById(retailerId)
                .orElseThrow(() -> new RuntimeException("Retailer not found!"));

        List<Batch> inventory = batchRepository.findByCurrentOwner(retailer);
        List<Payment> paymentsSent = paymentRepository.findByPayerId(retailerId).stream()
                .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                .collect(Collectors.toList());

        Map<String, BigDecimal> monthlySpending = getMonthlyData(paymentsSent);

        Map<String, Object> stats = new HashMap<>();
        stats.put("inventoryCount", inventory.size());
        stats.put("monthlySpending", monthlySpending);
        stats.put("totalSpent", paymentsSent.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));

        return stats;
    }

    public Map<String, Object> getAdminStats() {
        List<User> users = userRepository.findAll();
        List<Batch> batches = batchRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", users.size());
        stats.put("totalBatches", batches.size());
        stats.put("totalTransactionVolume", payments.stream()
                .filter(p -> "COMPLETED".equals(p.getPaymentStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        
        stats.put("userRolesDistribution", users.stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting())));

        return stats;
    }

    private Map<String, BigDecimal> getMonthlyData(List<Payment> payments) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        payments.forEach(p -> {
            String month = p.getPaymentDate().getMonth().toString().substring(0, 3);
            result.put(month, result.getOrDefault(month, BigDecimal.ZERO).add(p.getAmount()));
        });
        return result;
    }

    private Map<String, BigDecimal> getMonthlyBatchData(List<Batch> batches) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        batches.forEach(b -> {
            String month = b.getCreatedAt().getMonth().toString().substring(0, 3);
            result.put(month, result.getOrDefault(month, BigDecimal.ZERO).add(b.getQuantityKg()));
        });
        return result;
    }
}
