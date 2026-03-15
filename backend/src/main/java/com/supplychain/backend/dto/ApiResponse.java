package com.supplychain.backend.dto;

public class ApiResponse {

    private boolean success;
    private String message;
    private Object data;

    // Constructor with data
    public ApiResponse(boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // Constructor without data
    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.data = null;
    }

    // Static helper methods
    public static ApiResponse success(String message, Object data) {
        return new ApiResponse(true, message, data);
    }

    public static ApiResponse success(String message) {
        return new ApiResponse(true, message);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, message);
    }

    // Getters
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public Object getData() { return data; }

    // Setters
    public void setSuccess(boolean success) { this.success = success; }
    public void setMessage(String message) { this.message = message; }
    public void setData(Object data) { this.data = data; }
}