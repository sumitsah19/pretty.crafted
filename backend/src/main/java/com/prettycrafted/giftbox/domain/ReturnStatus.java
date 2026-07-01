package com.prettycrafted.giftbox.domain;

/** Lifecycle of a return/exchange request as it moves through admin review. */
public enum ReturnStatus {
    PENDING, APPROVED, REJECTED, COMPLETED
}
