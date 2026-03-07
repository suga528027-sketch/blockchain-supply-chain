package com.supplychain.backend.repository;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBatch(Batch batch);
}