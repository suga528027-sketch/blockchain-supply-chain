package com.supplychain.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.User;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByBatchCode(String batchCode);
    List<Batch> findByFarmer(User farmer);
    List<Batch> findByCurrentOwner(User currentOwner);
    List<Batch> findByStatus(String status);
}