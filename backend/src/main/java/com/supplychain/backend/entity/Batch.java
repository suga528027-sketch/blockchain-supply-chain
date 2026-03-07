package com.supplychain.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_code", unique = true, nullable = false)
    private String batchCode;

    @ManyToOne
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    @ManyToOne
    @JoinColumn(name = "farm_id")
    private Farm farm;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "quantity_kg", nullable = false)
    private BigDecimal quantityKg;

    @Column(name = "price_per_kg")
    private BigDecimal pricePerKg;

    @Column(name = "harvest_date")
    private LocalDate harvestDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "quality_grade")
    private String qualityGrade;

    @Column(name = "description")
    private String description;

    @Column(name = "status")
    private String status = "CREATED";

    @ManyToOne
    @JoinColumn(name = "current_owner_id")
    private User currentOwner;

    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;

    @Column(name = "contract_batch_id")
    private Long contractBatchId;

    @Column(name = "qr_code_path")
    private String qrCodePath;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}