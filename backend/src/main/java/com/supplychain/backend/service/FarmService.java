package com.supplychain.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.supplychain.backend.entity.Farm;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.repository.FarmRepository;
import com.supplychain.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FarmService {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    // Get all farms
    public List<Farm> getAllFarms() {
        return farmRepository.findAll();
    }

    // Get farm by ID
    public Optional<Farm> getFarmById(Long id) {
        return farmRepository.findById(id);
    }

    // Get farms by farmer
    public List<Farm> getFarmsByFarmer(Long farmerId) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found!"));
        return farmRepository.findByFarmer(farmer);
    }

    // Create new farm
    public Farm createFarm(Farm farm) {
        return farmRepository.save(farm);
    }

    // Update farm
    public Farm updateFarm(Long id, Farm updatedFarm) {
        Farm existingFarm = farmRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Farm not found!"));
        existingFarm.setFarmName(updatedFarm.getFarmName());
        existingFarm.setLocation(updatedFarm.getLocation());
        existingFarm.setLatitude(updatedFarm.getLatitude());
        existingFarm.setLongitude(updatedFarm.getLongitude());
        existingFarm.setAreaInAcres(updatedFarm.getAreaInAcres());
        existingFarm.setCropTypes(updatedFarm.getCropTypes());
        return farmRepository.save(existingFarm);
    }

    // Delete farm
    public void deleteFarm(Long id) {
        farmRepository.deleteById(id);
    }
}