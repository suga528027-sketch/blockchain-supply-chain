package com.supplychain.backend.dto;

import lombok.Data;

@Data
public class DeleteAccountRequest {
    private String email;
    private String otp;
}
