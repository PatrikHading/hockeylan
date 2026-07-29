package com.norops.hockeylan.dto;

public enum LoanHistoryStatus {
    ALL,
    ACTIVE,
    RETURNED;

    public Boolean asReturnedValue() {
        return switch (this) {
            case ALL -> null;
            case ACTIVE -> false;
            case RETURNED -> true;
        };
    }
}