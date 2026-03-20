package com.supplychain.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.supplychain.backend.entity.Feedback;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByBatchId(Long batchId);
    List<Feedback> findByIsReviewedByAdminFalse();
    List<Feedback> findByConsumerId(Long consumerId);
}
