package com.supplychain.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.repository.BatchRepository;
import com.supplychain.backend.service.QRCodeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/qr")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QRCodeController {

    private final QRCodeService qrCodeService;
    private final BatchRepository batchRepository;

    // Generate QR code for a batch
    @GetMapping("/batch/{batchCode}")
    public ResponseEntity<byte[]> generateBatchQR(
            @PathVariable String batchCode) {
        try {
            Batch batch = batchRepository.findByBatchCode(batchCode)
                    .orElseThrow(() -> new RuntimeException("Batch not found!"));

            String qrContent = qrCodeService.generateBatchQRUrl(batchCode);
            byte[] qrCode = qrCodeService.generateQRCode(qrContent);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentLength(qrCode.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(qrCode);

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
