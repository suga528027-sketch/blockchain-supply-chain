package com.supplychain.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Feedback;
import com.supplychain.backend.service.FeedbackService;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse> submitFeedback(@RequestBody Map<String, Object> payload) {
        try {
            Long batchId = Long.valueOf(payload.get("batchId").toString());
            Long consumerId = Long.valueOf(payload.get("consumerId").toString());
            String comment = payload.get("comment").toString();
            Integer rating = Integer.valueOf(payload.get("rating").toString());
            String category = payload.get("category") != null ? payload.get("category").toString() : "GENERAL";

            Feedback feedback = feedbackService.submitFeedback(batchId, consumerId, comment, rating, category);
            return ResponseEntity.ok(ApiResponse.success("Feedback submitted successfully", feedback));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/consumer/{consumerId}")
    public ResponseEntity<ApiResponse> getConsumerFeedback(@PathVariable Long consumerId) {
        try {
            List<Feedback> feedbacks = feedbackService.getConsumerFeedback(consumerId);
            return ResponseEntity.ok(ApiResponse.success("Consumer feedback retrieved", feedbacks));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse> getPendingFeedback() {
        try {
            List<Feedback> pending = feedbackService.getUnreviewedFeedback();
            return ResponseEntity.ok(ApiResponse.success("Pending feedback retrieved", pending));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/review")
    public ResponseEntity<ApiResponse> reviewFeedback(@RequestBody Map<String, Object> payload) {
        try {
            Long feedbackId = Long.valueOf(payload.get("feedbackId").toString());
            Double farmerRating = Double.valueOf(payload.get("farmerRating").toString());
            Double transporterRating = Double.valueOf(payload.get("transporterRating").toString());
            Double retailerRating = Double.valueOf(payload.get("retailerRating").toString());

            feedbackService.reviewFeedback(feedbackId, farmerRating, transporterRating, retailerRating);
            return ResponseEntity.ok(ApiResponse.success("Feedback reviewed and ratings updated", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
