package com.supplychain.backend.repository;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.entity.TrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TrackingEventRepository extends JpaRepository<TrackingEvent, Long> {
    List<TrackingEvent> findByBatchOrderByEventTimestampAsc(Batch batch);
}