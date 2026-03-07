package com.supplychain.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.supplychain.backend.entity.Farm;
import com.supplychain.backend.entity.User;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long> {
    List<Farm> findByFarmer(User farmer);
}
