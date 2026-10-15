
package com.frauddetection.backend.service;

import com.frauddetection.backend.model.TransactionRequest;
import com.frauddetection.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

@Service
public class FraudDetectionService {
    private final TransactionRepository transactionRepository;

    public FraudDetectionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public String detectFraud(TransactionRequest transaction) {
        String result;

        if (transaction.getAmount() <= 0) {
            return "INVALID";
        } else if (transaction.getAmount() >= 100000) {
            result = "HIGH RISK";
        } else if (transaction.getLocation() == null
                || transaction.getLocation().isBlank()) {
            result = "REVIEW";
        } else {
            result = "LOW RISK";
        }

        transactionRepository.save(transaction, result);
        System.out.println("Saved transaction: " + result);
        return result;
    }
}
