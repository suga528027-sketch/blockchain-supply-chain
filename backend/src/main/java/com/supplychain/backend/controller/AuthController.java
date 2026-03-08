package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.dto.LoginRequest;
import com.supplychain.backend.dto.LoginResponse;
import com.supplychain.backend.dto.RegisterRequest;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.security.JwtUtil;
import com.supplychain.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // Register new user
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest request) {
        try {
            User user = new User();
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setPhone(request.getPhone());
            user.setRole(request.getRole());
            user.setWalletAddress(request.getWalletAddress());
            user.setAadhaarNumber(request.getAadhaarNumber());
            user.setAddress(request.getAddress());

            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(
                new ApiResponse(true, "User registered successfully!", savedUser)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.getUserByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found!"));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid password!"));
            }

            if (!user.getIsActive()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Account is disabled!"));
            }

            String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole(),
                user.getId()
            );

            LoginResponse loginResponse = new LoginResponse(
                token,
                user.getEmail(),
                user.getRole(),
                user.getFullName(),
                user.getId()
            );

            return ResponseEntity.ok(
                new ApiResponse(true, "Login successful!", loginResponse)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Get current user info
    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            User user = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found!"));
            return ResponseEntity.ok(
                new ApiResponse(true, "Success", user)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
}