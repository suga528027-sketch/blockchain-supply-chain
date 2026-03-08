package com.supplychain.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.TrackingEvent;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.repository.BatchRepository;
import com.supplychain.backend.repository.TrackingEventRepository;
import com.supplychain.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final UserRepository userRepository;

    // Get all batches
    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    // Get batch by ID
    public Optional<Batch> getBatchById(Long id) {
        return batchRepository.findById(id);
    }

    // Get batch by batch code
    public Optional<Batch> getBatchByCode(String batchCode) {
        return batchRepository.findByBatchCode(batchCode);
    }

    // Get batches by farmer
    public List<Batch> getBatchesByFarmer(Long farmerId) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found!"));
        return batchRepository.findByFarmer(farmer);
    }

    // Get batches by current owner
    public List<Batch> getBatchesByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        return batchRepository.findByCurrentOwner(owner);
    }

    // Create new batch
    public Batch createBatch(Batch batch) {
        // Generate unique batch code
        String batchCode = "BATCH-" +
                batch.getProductName().substring(0, 3).toUpperCase() +
                "-" + System.currentTimeMillis();
        batch.setBatchCode(batchCode);
        batch.setStatus("CREATED");
        batch.setCurrentOwner(batch.getFarmer());
        Batch savedBatch = batchRepository.save(batch);

        // Record tracking event
        TrackingEvent event = new TrackingEvent();
        event.setBatch(savedBatch);
        event.setEventType("BATCH_CREATED");
        event.setFromUser(batch.getFarmer());
        event.setToUser(batch.getFarmer());
        event.setNotes("Batch created by farmer");
        event.setEventTimestamp(LocalDateTime.now());
        trackingEventRepository.save(event);

        return savedBatch;
    }

    // Transfer batch ownership
    public Batch transferOwnership(Long batchId, Long newOwnerId, String location, String notes) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
        User newOwner = userRepository.findById(newOwnerId)
                .orElseThrow(() -> new RuntimeException("New owner not found!"));

        User previousOwner = batch.getCurrentOwner();
        batch.setCurrentOwner(newOwner);
        batch.setStatus("IN_TRANSIT");
        Batch updatedBatch = batchRepository.save(batch);

        // Record tracking event
        TrackingEvent event = new TrackingEvent();
        event.setBatch(updatedBatch);
        event.setEventType("OWNERSHIP_TRANSFERRED");
        event.setFromUser(previousOwner);
        event.setToUser(newOwner);
        event.setLocation(location);
        event.setNotes(notes);
        event.setEventTimestamp(LocalDateTime.now());
        trackingEventRepository.save(event);

        return updatedBatch;
    }

    // Confirm delivery
    public Batch confirmDelivery(Long batchId, Long retailerId) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
        User retailer = userRepository.findById(retailerId)
                .orElseThrow(() -> new RuntimeException("Retailer not found!"));

        batch.setStatus("DELIVERED");
        Batch updatedBatch = batchRepository.save(batch);

        // Record tracking event
        TrackingEvent event = new TrackingEvent();
        event.setBatch(updatedBatch);
        event.setEventType("DELIVERED");
        event.setFromUser(batch.getCurrentOwner());
        event.setToUser(retailer);
        event.setNotes("Delivery confirmed by retailer");
        event.setEventTimestamp(LocalDateTime.now());
        trackingEventRepository.save(event);

        return updatedBatch;
    }

    // Get tracking history of a batch
    public List<TrackingEvent> getBatchTrackingHistory(Long batchId) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
        return trackingEventRepository.findByBatchOrderByEventTimestampAsc(batch);
    }

    // Delete batch
    public void deleteBatch(Long id) {
        batchRepository.deleteById(id);
    }
}