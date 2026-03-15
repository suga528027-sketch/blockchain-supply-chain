package com.supplychain.backend.repository;

import com.supplychain.backend.entity.Dispute;
import com.supplychain.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByRaisedBy(User raisedBy);
    List<Dispute> findByStatus(String status);
    List<Dispute> findByBatchId(Long batchId);
    List<Dispute> findByRaisedById(Long userId);
}