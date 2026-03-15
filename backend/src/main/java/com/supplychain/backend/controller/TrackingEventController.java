package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.TrackingEvent;
import com.supplychain.backend.repository.TrackingEventRepository;
import com.supplychain.backend.repository.BatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TrackingEventController {

    private final TrackingEventRepository trackingEventRepository;
    private final BatchRepository batchRepository;

    // Get all tracking events for a batch
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<ApiResponse> getTrackingEvents(
            @PathVariable Long batchId) {
        List<TrackingEvent> events = trackingEventRepository
                .findByBatchIdOrderByEventTimestampAsc(batchId);
        return ResponseEntity.ok(ApiResponse.success("Tracking events fetched!", events));
    }

    // Add new tracking event
    @PostMapping
    public ResponseEntity<ApiResponse> addTrackingEvent(
            @RequestBody TrackingEvent event) {
        if (event.getEventTimestamp() == null) {
            event.setEventTimestamp(LocalDateTime.now());
        }
        TrackingEvent saved = trackingEventRepository.save(event);
        return ResponseEntity.ok(ApiResponse.success("Tracking event added!", saved));
    }
}