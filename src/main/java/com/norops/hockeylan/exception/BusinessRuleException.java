package com.norops.hockeylan.exception;

public class BusinessRuleException
        extends RuntimeException {

    private final ApiErrorCode code;

    public BusinessRuleException(
            String message
    ) {
        this(
                ApiErrorCode
                        .BUSINESS_RULE_VIOLATION,
                message
        );
    }

    public BusinessRuleException(
            ApiErrorCode code,
            String message
    ) {
        super(message);

        this.code =
                code == null
                        ? ApiErrorCode
                        .BUSINESS_RULE_VIOLATION
                        : code;
    }

    public ApiErrorCode getCode() {
        return code;
    }
}