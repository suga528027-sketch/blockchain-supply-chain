package com.supplychain.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private String role;
    private String walletAddress;
    private String aadhaarNumber;
    private String address;
}