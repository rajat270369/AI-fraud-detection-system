package com.frauddetection.backend.model;

public class TransactionRequest {

    private double amount;
    private String sender;
    private String receiver;
    private String location;

    public TransactionRequest() {
    }

    public TransactionRequest(double amount, String sender, String receiver, String location) {
        this.amount = amount;
        this.sender = sender;
        this.receiver = receiver;
        this.location = location;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}