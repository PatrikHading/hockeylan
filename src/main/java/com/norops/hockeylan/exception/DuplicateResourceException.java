package com.norops.hockeylan.exception;

public class DuplicateResourceException
        extends RuntimeException {

    private final ApiErrorCode code;

    public DuplicateResourceException(
            String message
    ) {
        this(
                ApiErrorCode.DUPLICATE_RESOURCE,
                message
        );
    }

    public DuplicateResourceException(
            ApiErrorCode code,
            String message
    ) {
        super(message);

        this.code =
                code == null
                        ? ApiErrorCode
                        .DUPLICATE_RESOURCE
                        : code;
    }

    public ApiErrorCode getCode() {
        return code;
    }
}