package com.supplychain.backend.repository;

import com.supplychain.backend.entity.ProductRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRequestRepository extends JpaRepository<ProductRequest, Long> {
    List<ProductRequest> findByRequesterId(Long requesterId);
    List<ProductRequest> findByOwnerId(Long ownerId);
}
