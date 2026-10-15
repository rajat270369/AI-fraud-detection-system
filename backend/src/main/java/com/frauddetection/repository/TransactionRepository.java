
package com.frauddetection.backend.repository;

import com.frauddetection.backend.model.TransactionRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TransactionRepository {

    private final JdbcTemplate jdbcTemplate;

    public TransactionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(TransactionRequest transaction, String fraudStatus) {
        String sql = """
            INSERT INTO transactions
                (amount, sender, receiver, location, fraud_status)
            VALUES (?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(
            sql,
            transaction.getAmount(),
            transaction.getSender(),
            transaction.getReceiver(),
            transaction.getLocation(),
            fraudStatus
        );
    }
}
