import {
    describe,
    expect,
    test,
} from "vitest";
import {
    CLIENT_ERROR_CODES,
    getErrorMessage,
    getFieldErrors,
    hasErrorCode,
    normalizeApiError,
} from "./api";

describe(
    "API error normalization",
    () => {
        test(
            "uses machine-readable backend code",
            () => {
                const error = {
                    response: {
                        status: 409,
                        data: {
                            code:
                                "EQUIPMENT_ALREADY_LOANED",
                            message:
                                "Text som frontend "
                                + "inte ska tolka.",
                            fieldErrors: {},
                        },
                        headers: {},
                    },
                };

                const normalized =
                    normalizeApiError(
                        error
                    );

                expect(
                    normalized.code
                ).toBe(
                    "EQUIPMENT_ALREADY_LOANED"
                );

                expect(
                    normalized.displayMessage
                ).toBe(
                    "Utrustningen är redan utlånad."
                );
            }
        );

        test(
            "normalizes validation field errors",
            () => {
                const error = {
                    response: {
                        status: 400,
                        data: {
                            code:
                                "VALIDATION_FAILED",
                            fieldErrors: {
                                email:
                                    "Ange en giltig "
                                    + "e-postadress.",
                                borrowerName:
                                    "Namn måste anges.",
                            },
                        },
                        headers: {},
                    },
                };

                const normalized =
                    normalizeApiError(
                        error
                    );

                expect(
                    normalized.code
                ).toBe(
                    "VALIDATION_FAILED"
                );

                expect(
                    normalized.fieldErrors
                ).toEqual({
                    email:
                        "Ange en giltig "
                        + "e-postadress.",
                    borrowerName:
                        "Namn måste anges.",
                });
            }
        );

        test(
            "rejects malformed field error data",
            () => {
                const error = {
                    response: {
                        status: 400,
                        data: {
                            code:
                                "VALIDATION_FAILED",
                            fieldErrors: {
                                valid:
                                    "Ett giltigt fel.",
                                numeric: 123,
                                long:
                                    "x".repeat(
                                        301
                                    ),
                            },
                        },
                        headers: {},
                    },
                };

                expect(
                    getFieldErrors(error)
                ).toEqual({
                    valid:
                        "Ett giltigt fel.",
                });
            }
        );

        test(
            "maps timeout to local timeout code",
            () => {
                const error = {
                    code: "ECONNABORTED",
                    message: "timeout",
                };

                const normalized =
                    normalizeApiError(
                        error
                    );

                expect(
                    normalized.code
                ).toBe(
                    CLIENT_ERROR_CODES
                        .REQUEST_TIMEOUT
                );

                expect(
                    normalized.displayMessage
                ).toContain(
                    "svarade inte i tid"
                );
            }
        );

        test(
            "maps missing response to network error",
            () => {
                const error = {
                    message:
                        "Network Error",
                };

                const normalized =
                    normalizeApiError(
                        error
                    );

                expect(
                    normalized.code
                ).toBe(
                    CLIENT_ERROR_CODES
                        .NETWORK_ERROR
                );

                expect(
                    normalized.displayMessage
                ).toContain(
                    "kontakta servern"
                );
            }
        );

        test(
            "uses status fallback when backend code is missing",
            () => {
                const error = {
                    response: {
                        status: 429,
                        data: {},
                        headers: {
                            "retry-after":
                                "300",
                        },
                    },
                };

                const normalized =
                    normalizeApiError(
                        error
                    );

                expect(
                    normalized.code
                ).toBe(
                    "RATE_LIMIT_EXCEEDED"
                );

                expect(
                    normalized.retryAfterSeconds
                ).toBe(300);
            }
        );

        test(
            "does not display unknown server message",
            () => {
                const error = {
                    response: {
                        status: 500,
                        data: {
                            code:
                                "UNKNOWN_BACKEND_CODE",
                            message:
                                "Sensitive database detail",
                        },
                        headers: {},
                    },
                };

                expect(
                    getErrorMessage(error)
                ).toBe(
                    "Ett serverfel inträffade. "
                    + "Försök igen senare."
                );
            }
        );

        test(
            "checks codes without comparing messages",
            () => {
                const error = {
                    response: {
                        status: 403,
                        data: {
                            code:
                                "ACCESS_DENIED",
                        },
                        headers: {},
                    },
                };

                expect(
                    hasErrorCode(
                        error,
                        "ACCESS_DENIED"
                    )
                ).toBe(true);

                expect(
                    hasErrorCode(
                        error,
                        "INVALID_CREDENTIALS"
                    )
                ).toBe(false);
            }
        );
    }
);