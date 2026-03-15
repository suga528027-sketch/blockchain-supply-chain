package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.TrackingEvent;
import com.supplychain.backend.repository.TrackingEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/fix-map")
@RequiredArgsConstructor
public class MapFixController {

    private final TrackingEventRepository repository;

    @GetMapping
    public ResponseEntity<ApiResponse> fixCoordinates() {
        List<TrackingEvent> events = repository.findAll();
        int count = 0;
        for (TrackingEvent event : events) {
            if (event.getLatitude() == null) {
                // Assign some coordinates in South India for testing
                if (event.getEventType().equals("BATCH_CREATED")) {
                    event.setLatitude(new BigDecimal("13.0827"));
                    event.setLongitude(new BigDecimal("80.2707"));
                } else if (event.getEventType().equals("OWNERSHIP_TRANSFERRED")) {
                    event.setLatitude(new BigDecimal("12.9716"));
                    event.setLongitude(new BigDecimal("77.5946"));
                } else {
                    event.setLatitude(new BigDecimal("9.9252"));
                    event.setLongitude(new BigDecimal("78.1198"));
                }
                repository.save(event);
                count++;
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Fixed " + count + " events with coordinates!"));
    }
}
