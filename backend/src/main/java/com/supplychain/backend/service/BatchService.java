package com.supplychain.backend.service;

import java.math.BigDecimal;
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
import com.supplychain.backend.repository.PaymentRepository;
import com.supplychain.backend.repository.DisputeRepository;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository batchRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final DisputeRepository disputeRepository;

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

        // Record tracking event with coordinates if available in the batch object 
        // (we'll check for temporary storage or default to null)
        TrackingEvent event = new TrackingEvent();
        event.setBatch(savedBatch);
        event.setEventType("BATCH_CREATED");
        event.setFromUser(batch.getFarmer());
        event.setToUser(batch.getFarmer());
        event.setNotes("Batch created by farmer");
        event.setEventTimestamp(LocalDateTime.now());
        // For creation, we could try to get coordinates from the farm if linked
        if (batch.getFarm() != null && batch.getFarm().getLatitude() != null) {
            event.setLatitude(batch.getFarm().getLatitude());
            event.setLongitude(batch.getFarm().getLongitude());
        }
        trackingEventRepository.save(event);

        return savedBatch;
    }

    // Update batch
    public Batch updateBatch(Long id, Batch batchDetails) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));

        if (batchDetails.getProductName() != null) batch.setProductName(batchDetails.getProductName());
        if (batchDetails.getQuantityKg() != null) batch.setQuantityKg(batchDetails.getQuantityKg());
        if (batchDetails.getPricePerKg() != null) batch.setPricePerKg(batchDetails.getPricePerKg());
        if (batchDetails.getQualityGrade() != null) batch.setQualityGrade(batchDetails.getQualityGrade());
        if (batchDetails.getHarvestDate() != null) batch.setHarvestDate(batchDetails.getHarvestDate());
        if (batchDetails.getExpiryDate() != null) batch.setExpiryDate(batchDetails.getExpiryDate());
        if (batchDetails.getDescription() != null) batch.setDescription(batchDetails.getDescription());

        return batchRepository.save(batch);
    }

    // Transfer batch ownership
    public Batch transferOwnership(Long batchId, Long newOwnerId, String location, String notes, BigDecimal lat, BigDecimal lon) {
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
        event.setLatitude(lat);
        event.setLongitude(lon);
        event.setEventTimestamp(LocalDateTime.now());
        trackingEventRepository.save(event);

        return updatedBatch;
    }

    // Confirm delivery
    public Batch confirmDelivery(Long batchId, Long retailerId, BigDecimal lat, BigDecimal lon) {
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
        event.setNotes("Product delivered and confirmed by retailer");
        event.setLatitude(lat);
        event.setLongitude(lon);
        event.setEventTimestamp(LocalDateTime.now());
        trackingEventRepository.save(event);

        return updatedBatch;
    }

    // Add a custom tracking event
    public void addEvent(Batch batch, String type, String notes, User from, User to) {
        TrackingEvent event = new TrackingEvent();
        event.setBatch(batch);
        event.setEventType(type);
        event.setNotes(notes);
        event.setFromUser(from);
        event.setToUser(to);
        event.setEventTimestamp(LocalDateTime.now());
        trackingEventRepository.save(event);
    }

    // Get tracking history of a batch
    public List<TrackingEvent> getBatchTrackingHistory(Long batchId) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));
        return trackingEventRepository.findByBatchIdOrderByEventTimestampAsc(batch.getId());
    }

    // Delete batch
    @Transactional
    public void deleteBatch(Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found!"));

        // Delete associated tracking events
        trackingEventRepository.deleteAll(trackingEventRepository.findByBatchId(id));

        // Delete associated payments
        paymentRepository.deleteAll(paymentRepository.findByBatch(batch));

        // Delete associated disputes
        disputeRepository.deleteAll(disputeRepository.findByBatchId(id));

        // Delete the batch
        batchRepository.delete(batch);
    }
}