package com.supplychain.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.Feedback;
import com.supplychain.backend.entity.TrackingEvent;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.repository.BatchRepository;
import com.supplychain.backend.repository.FeedbackRepository;
import com.supplychain.backend.repository.TrackingEventRepository;
import com.supplychain.backend.repository.UserRepository;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackingEventRepository trackingEventRepository;

    public Feedback submitFeedback(Long batchId, Long consumerId, String comment, Integer rating, String category) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        
        User consumer = userRepository.findById(consumerId)
                .orElseThrow(() -> new RuntimeException("Consumer not found"));

        Feedback feedback = new Feedback();
        feedback.setBatch(batch);
        feedback.setConsumer(consumer);
        feedback.setComment(comment);
        feedback.setRating(rating);
        feedback.setCategory(category);
        feedback.setIsReviewedByAdmin(false);

        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getConsumerFeedback(Long consumerId) {
        return feedbackRepository.findByConsumerId(consumerId);
    }

    public List<Feedback> getUnreviewedFeedback() {
        return feedbackRepository.findByIsReviewedByAdminFalse();
    }

    @Transactional
    public void reviewFeedback(Long feedbackId, Double farmerRating, Double transporterRating, Double retailerRating) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        if (feedback.getIsReviewedByAdmin()) {
            throw new RuntimeException("Feedback already reviewed");
        }

        Batch batch = feedback.getBatch();

        // 1. Rate Farmer
        updateUserRating(batch.getFarmer(), farmerRating);

        // 2. Rate Transporter (Find from tracking events)
        List<TrackingEvent> events = trackingEventRepository.findByBatchId(batch.getId());
        User transporter = events.stream()
                .filter(e -> "TRANSPORTER_ACCEPTED".equals(e.getEventType()) || "DELIVERED".equals(e.getEventType()))
                .map(e -> "DELIVERED".equals(e.getEventType()) ? e.getFromUser() : e.getToUser())
                .filter(u -> u != null && "TRANSPORTER".equals(u.getRole()))
                .findFirst()
                .orElse(null);
        if (transporter != null) {
            updateUserRating(transporter, transporterRating);
        }

        // 3. Rate Retailer
        User retailer = events.stream()
                .filter(e -> "ACCEPTED_BY_RETAILER".equals(e.getEventType()) || "DELIVERED".equals(e.getEventType()))
                .map(TrackingEvent::getToUser)
                .filter(u -> u != null && "RETAILER".equals(u.getRole()))
                .findFirst()
                .orElse(null);
        if (retailer != null) {
            updateUserRating(retailer, retailerRating);
        }

        feedback.setIsReviewedByAdmin(true);
        feedbackRepository.save(feedback);
    }

    private void updateUserRating(User user, Double rating) {
        if (user == null || rating == null || rating < 0) return;
        
        user.setTotalRatingScore(user.getTotalRatingScore() + rating);
        user.setRatingCount(user.getRatingCount() + 1);
        userRepository.save(user);
    }
}
