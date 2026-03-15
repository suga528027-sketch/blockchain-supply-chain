package com.supplychain.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.supplychain.backend.entity.User;
import com.supplychain.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${google.client.id}")
    private String googleClientId;

    public void initiateForgotPassword(String email) {
        System.out.println("Processing forgot password for: " + email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address."));

        // Generate 6-digit OTP
        String otp = String.valueOf((int)((Math.random() * 900000) + 100000));
        user.setResetOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10)); // 10 min expiry
        userRepository.save(user);

        System.out.println("\n\n");
        System.out.println("=================================================================");
        System.out.println("⚠️  DEVELOPER DEBUG: PASSWORD RESET OTP");
        System.out.println("📧 EMAIL: " + user.getEmail());
        System.out.println("🔑 OTP CODE: " + otp);
        System.out.println("=================================================================");
        System.out.println("\n\n");

        sendResetOtpEmail(user.getEmail(), otp);
    }

    private void sendResetOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("AgriChain Support <no-reply@agrichain.com>");
            message.setTo(email);
            message.setSubject("Your Password Reset OTP - AgriChain");
            message.setText("Your OTP for password reset is: " + otp + "\n\n" +
                    "This code will expire in 10 minutes. Do not share it with anyone.");

            if (mailSender != null) {
                mailSender.send(message);
            } else {
                System.out.println("SKIPPING EMAIL: JavaMailSender not initialized.");
            }
            System.out.println("Reset OTP sent successfully to: " + email);
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to send reset OTP to " + email);
            System.err.println("Reason: " + e.getMessage());
        }
    }

    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP code!");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP code has expired!");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    public User processGoogleLogin(String tokenString) throws Exception {
        String email = null;
        String name = null;

        System.out.println("Processing Google Login with token: " + (tokenString != null ? tokenString.substring(0, 10) + "..." : "null"));

        try {
            // Check if it's likely an ID Token (JWT format has 3 parts separated by dots)
            if (tokenString != null && tokenString.contains(".") && tokenString.split("\\.").length == 3) {
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                        .setAudience(Collections.singletonList(googleClientId))
                        .build();

                GoogleIdToken idToken = verifier.verify(tokenString);
                if (idToken != null) {
                    GoogleIdToken.Payload payload = idToken.getPayload();
                    email = payload.getEmail();
                    name = (String) payload.get("name");
                }
            }

            // Fallback: If email is still null, treat as Access Token
            if (email == null) {
                RestTemplate restTemplate = new RestTemplate();
                String url = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + tokenString;
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                
                if (response == null || response.containsKey("error")) {
                    // Try tokeninfo as sub-fallback
                    url = "https://oauth2.googleapis.com/tokeninfo?access_token=" + tokenString;
                    response = restTemplate.getForObject(url, Map.class);
                }

                if (response != null && !response.containsKey("error")) {
                    email = (String) response.get("email");
                    name = (String) response.get("name");
                    if (name == null) name = (String) response.get("given_name");
                    if (name == null) name = email.split("@")[0];
                }
            }

            if (email == null) {
                throw new RuntimeException("Could not extract email from Google Token");
            }

        } catch (Exception e) {
            e.printStackTrace(); // This will print the real error to your backend terminal
            throw new RuntimeException("Google authentication failed: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.getIsActive()) {
                throw new RuntimeException("Account is disabled!");
            }
            return user;
        } else {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(name != null ? name : email.split("@")[0]);
            newUser.setRole("CONSUMER");
            newUser.setIsActive(true);
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            return userRepository.save(newUser);
        }
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // Get user by email
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Register new user
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setIsActive(true);
        return userRepository.save(user);
    }

    // Update user
    public User updateUser(Long id, User updatedUser) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setAddress(updatedUser.getAddress());
        existingUser.setWalletAddress(updatedUser.getWalletAddress());
        return userRepository.save(existingUser);
    }

    // Delete user
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // Ban user (set isActive = false)
    public User banUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        user.setIsActive(false);
        return userRepository.save(user);
    }

    // Activate user (set isActive = true)
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        user.setIsActive(true);
        return userRepository.save(user);
    }

    // Check if email exists
    public Boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public void initiateAccountDeletion(String email) {
        System.out.println("Processing account deletion request for: " + email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = String.valueOf((int)((Math.random() * 900000) + 100000));
        user.setResetOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        System.out.println("=================================================================");
        System.out.println("⚠️  DEVELOPER DEBUG: ACCOUNT DELETION OTP");
        System.out.println("📧 EMAIL: " + user.getEmail());
        System.out.println("🔑 OTP CODE: " + otp);
        System.out.println("=================================================================");

        sendDeleteOtpEmail(user.getEmail(), otp);
    }

    private void sendDeleteOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("AgriChain Support <no-reply@agrichain.com>");
            message.setTo(email);
            message.setSubject("Security Alert: Account Deletion OTP - AgriChain");
            message.setText("We received a request to delete your AgriChain account.\n\n" +
                    "Your verification code is: " + otp + "\n\n" +
                    "This code will expire in 10 minutes. If you did not request this, please secure your account immediately.");

            if (mailSender != null) {
                mailSender.send(message);
            }
            System.out.println("Delete OTP sent to: " + email);
        } catch (Exception e) {
            System.err.println("Failed to send delete OTP: " + e.getMessage());
        }
    }

    public void verifyAndDeleteAccount(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new RuntimeException("Invalid verification code!");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code has expired!");
        }

        userRepository.delete(user);
        System.out.println("User account deleted success: " + email);
    }
}