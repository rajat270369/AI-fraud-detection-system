package com.frauddetection.backend.controller;

import com.frauddetection.backend.model.TransactionRequest;
import com.frauddetection.backend.service.FraudDetectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fraud")
@CrossOrigin(origins = "http://localhost:5173")
public class FraudDetectionController {

    private final FraudDetectionService fraudDetectionService;

    public FraudDetectionController(FraudDetectionService fraudDetectionService) {
        this.fraudDetectionService = fraudDetectionService;
    }

    @PostMapping("/check")
    public ResponseEntity<String> checkTransaction(
            @RequestBody TransactionRequest transaction) {

        String result = fraudDetectionService.detectFraud(transaction);

        if ("INVALID".equals(result)) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }
}