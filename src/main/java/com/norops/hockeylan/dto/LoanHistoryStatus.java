package com.norops.hockeylan.dto;

public enum LoanHistoryStatus {
    ALL,
    ACTIVE,
    OVERDUE,
    RETURNED;

    public Boolean asReturnedValue() {
        return switch (this) {
            case ALL -> null;

            case ACTIVE,
                 OVERDUE -> false;

            case RETURNED -> true;
        };
    }

    public boolean requiresOverdueFilter() {
        return this == OVERDUE;
    }
}