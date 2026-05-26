package com.prettycrafted.giftbox.exception;

import org.springframework.http.HttpStatus;

public class PaymentGatewayException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public PaymentGatewayException(String code, String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
