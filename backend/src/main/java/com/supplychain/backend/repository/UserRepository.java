package com.supplychain.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.supplychain.backend.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByWalletAddress(String walletAddress);
    Optional<User> findByResetOtp(String resetOtp);
    Boolean existsByEmail(String email);
}
