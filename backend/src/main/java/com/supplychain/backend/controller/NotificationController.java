package com.supplychain.backend.controller;

import com.supplychain.backend.dto.ApiResponse;
import com.supplychain.backend.entity.Notification;
import com.supplychain.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse> getNotificationsByUser(@PathVariable Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully", notifications));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long id) {
        try {
            Optional<Notification> optionalNotification = notificationRepository.findById(id);
            if (optionalNotification.isPresent()) {
                Notification notification = optionalNotification.get();
                notification.setIsRead(true);
                notificationRepository.save(notification);
                return ResponseEntity.ok(ApiResponse.success("Notification marked as read successfully", notification));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Notification not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead(@PathVariable Long userId) {
        try {
            List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(userId);
            for (Notification notification : unreadNotifications) {
                notification.setIsRead(true);
            }
            notificationRepository.saveAll(unreadNotifications);
            return ResponseEntity.ok(ApiResponse.success("All notifications marked as read successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{userId}/unread-count")
    public ResponseEntity<ApiResponse> getUnreadCount(@PathVariable Long userId) {
        try {
            List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(userId);
            return ResponseEntity.ok(ApiResponse.success("Unread count fetched successfully", unreadNotifications.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
