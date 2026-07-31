import axios from "axios";

export const ADMIN_UNAUTHORIZED_EVENT =
    "admin-session-expired";

export const CLIENT_ERROR_CODES =
    Object.freeze({
        NETWORK_ERROR:
            "NETWORK_ERROR",
        REQUEST_TIMEOUT:
            "REQUEST_TIMEOUT",
        UNKNOWN_ERROR:
            "UNKNOWN_ERROR",
    });

const DEFAULT_ERROR_MESSAGE =
    "Ett oväntat fel uppstod. Försök igen.";

const MAX_FIELD_MESSAGE_LENGTH =
    300;

const ERROR_MESSAGES =
    Object.freeze({
        VALIDATION_FAILED:
            "Kontrollera de markerade fälten.",

        INVALID_REQUEST:
            "Begäran kunde inte behandlas.",

        MALFORMED_REQUEST:
            "Begäran innehåller uppgifter "
            + "som inte kunde läsas.",

        INVALID_QR_CODE:
            "QR-koden är inte giltig.",

        INVALID_CREDENTIALS:
            "Felaktigt användarnamn eller lösenord.",

        AUTHENTICATION_REQUIRED:
            "Din administratörssession har gått ut. "
            + "Logga in igen.",

        ACCESS_DENIED:
            "Du saknar behörighet för åtgärden.",

        RESOURCE_NOT_FOUND:
            "Den begärda informationen "
            + "kunde inte hittas.",

        EQUIPMENT_NOT_FOUND:
            "Utrustningen kunde inte hittas. "
            + "Kontrollera QR-koden eller serienumret.",

        ENDPOINT_NOT_FOUND:
            "Den begärda funktionen finns inte.",

        METHOD_NOT_ALLOWED:
            "Åtgärden stöds inte.",

        DUPLICATE_RESOURCE:
            "Det finns redan en resurs "
            + "med samma unika uppgifter.",

        EQUIPMENT_ALREADY_LOANED:
            "Utrustningen är redan utlånad.",

        EQUIPMENT_INACTIVE:
            "Utrustningen är inaktiverad "
            + "och kan inte lånas.",

        LOAN_ALREADY_RETURNED:
            "Lånet är redan återlämnat.",

        BUSINESS_RULE_VIOLATION:
            "Åtgärden kan inte genomföras "
            + "i objektets nuvarande status.",

        DATA_CONFLICT:
            "Begäran står i konflikt "
            + "med befintliga data.",

        UNSUPPORTED_MEDIA_TYPE:
            "Begäran har ett format "
            + "som inte stöds.",

        PAYLOAD_TOO_LARGE:
            "Begäran innehåller för mycket data.",

        RATE_LIMIT_EXCEEDED:
            "För många anrop. Försök igen senare.",

        INTERNAL_SERVER_ERROR:
            "Ett serverfel inträffade. "
            + "Försök igen senare.",

        NETWORK_ERROR:
            "Det gick inte att kontakta servern. "
            + "Kontrollera anslutningen.",

        REQUEST_TIMEOUT:
            "Servern svarade inte i tid. "
            + "Försök igen.",

        UNKNOWN_ERROR:
        DEFAULT_ERROR_MESSAGE,
    });

const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL
    || "/api";

const api =
    axios.create({
        baseURL: apiBaseUrl,
        headers: {
            "Content-Type":
                "application/json",
        },
        timeout: 10000,
        withCredentials: true,
        withXSRFToken: true,
        xsrfCookieName:
            "XSRF-TOKEN",
        xsrfHeaderName:
            "X-XSRF-TOKEN",
    });

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const normalizedError =
            normalizeApiError(error);

        if (
            normalizedError.code
            === "AUTHENTICATION_REQUIRED"
            && isAdminRequest(
                normalizedError
                    .originalError
                    ?.config
                    ?.url
            )
        ) {
            window.dispatchEvent(
                new CustomEvent(
                    ADMIN_UNAUTHORIZED_EVENT,
                    {
                        detail: {
                            code:
                            normalizedError
                                .code,
                            message:
                            normalizedError
                                .displayMessage,
                        },
                    }
                )
            );
        }

        applyNormalizedError(
            error,
            normalizedError
        );

        return Promise.reject(
            error
        );
    }
);

export function normalizeApiError(
    error
) {
    const serverCode =
        readServerCode(error);

    const status =
        readStatus(error);

    const code =
        resolveErrorCode(
            error,
            serverCode,
            status
        );

    return {
        code,
        status,
        displayMessage:
            resolveDisplayMessage(
                code,
                status
            ),
        fieldErrors:
            normalizeFieldErrors(
                error
                    ?.response
                    ?.data
                    ?.fieldErrors
            ),
        retryAfterSeconds:
            readRetryAfterSeconds(
                error
            ),
        originalError: error,
    };
}

export function getErrorMessage(
    error,
    fallbackMessage =
    DEFAULT_ERROR_MESSAGE
) {
    if (
        typeof error?.displayMessage
        === "string"
        && error
            .displayMessage
            .trim()
    ) {
        return error
            .displayMessage
            .trim();
    }

    const normalized =
        normalizeApiError(error);

    if (
        normalized.code
        === CLIENT_ERROR_CODES
            .UNKNOWN_ERROR
        && fallbackMessage
    ) {
        return fallbackMessage;
    }

    return normalized.displayMessage;
}

export function getFieldErrors(
    error
) {
    if (
        error?.fieldErrors
        && typeof error.fieldErrors
        === "object"
    ) {
        return {
            ...error.fieldErrors,
        };
    }

    return normalizeFieldErrors(
        error
            ?.response
            ?.data
            ?.fieldErrors
    );
}

export function hasErrorCode(
    error,
    ...codes
) {
    const errorCode =
        error?.apiCode
        || normalizeApiError(error).code;

    return codes.includes(
        errorCode
    );
}

export async function initializeCsrf() {
    await api.get(
        "/auth/csrf"
    );
}

function applyNormalizedError(
    error,
    normalized
) {
    error.apiCode =
        normalized.code;

    error.displayMessage =
        normalized.displayMessage;

    error.fieldErrors =
        normalized.fieldErrors;

    error.retryAfterSeconds =
        normalized.retryAfterSeconds;
}

function resolveErrorCode(
    error,
    serverCode,
    status
) {
    if (
        serverCode
        && Object.hasOwn(
            ERROR_MESSAGES,
            serverCode
        )
    ) {
        return serverCode;
    }

    if (isTimeoutError(error)) {
        return CLIENT_ERROR_CODES
            .REQUEST_TIMEOUT;
    }

    if (!error?.response) {
        return CLIENT_ERROR_CODES
            .NETWORK_ERROR;
    }

    return fallbackCodeForStatus(
        status
    );
}

function fallbackCodeForStatus(
    status
) {
    switch (status) {
        case 400:
            return "INVALID_REQUEST";

        case 401:
            return "AUTHENTICATION_REQUIRED";

        case 403:
            return "ACCESS_DENIED";

        case 404:
            return "RESOURCE_NOT_FOUND";

        case 405:
            return "METHOD_NOT_ALLOWED";

        case 409:
            return "DATA_CONFLICT";

        case 413:
            return "PAYLOAD_TOO_LARGE";

        case 415:
            return "UNSUPPORTED_MEDIA_TYPE";

        case 429:
            return "RATE_LIMIT_EXCEEDED";

        default:
            if (
                typeof status === "number"
                && status >= 500
            ) {
                return "INTERNAL_SERVER_ERROR";
            }

            return CLIENT_ERROR_CODES
                .UNKNOWN_ERROR;
    }
}

function resolveDisplayMessage(
    code,
    status
) {
    if (
        Object.hasOwn(
            ERROR_MESSAGES,
            code
        )
    ) {
        return ERROR_MESSAGES[code];
    }

    if (
        typeof status === "number"
        && status >= 500
    ) {
        return ERROR_MESSAGES
            .INTERNAL_SERVER_ERROR;
    }

    return DEFAULT_ERROR_MESSAGE;
}

function readServerCode(
    error
) {
    const code =
        error
            ?.response
            ?.data
            ?.code;

    if (
        typeof code !== "string"
        || !code.trim()
    ) {
        return null;
    }

    return code.trim();
}

function readStatus(
    error
) {
    const status =
        error?.response?.status;

    return typeof status === "number"
        ? status
        : null;
}

function isTimeoutError(
    error
) {
    return error?.code
        === "ECONNABORTED"
        || error?.code
        === "ETIMEDOUT";
}

function normalizeFieldErrors(
    fieldErrors
) {
    if (
        !fieldErrors
        || typeof fieldErrors
        !== "object"
        || Array.isArray(fieldErrors)
    ) {
        return {};
    }

    return Object.entries(
        fieldErrors
    ).reduce(
        (
            normalized,
            [field, message]
        ) => {
            if (
                typeof field
                !== "string"
                || !field.trim()
                || typeof message
                !== "string"
                || !message.trim()
                || message.length
                > MAX_FIELD_MESSAGE_LENGTH
            ) {
                return normalized;
            }

            normalized[
                field.trim()
                ] = message.trim();

            return normalized;
        },
        {}
    );
}

function readRetryAfterSeconds(
    error
) {
    const headerValue =
        error
            ?.response
            ?.headers
            ?.["retry-after"];

    const parsed =
        Number.parseInt(
            headerValue,
            10
        );

    if (
        !Number.isFinite(parsed)
        || parsed < 0
    ) {
        return null;
    }

    return parsed;
}

function isAdminRequest(
    url
) {
    if (typeof url !== "string") {
        return false;
    }

    return url.startsWith(
        "/admin/"
    );
}

export default api;