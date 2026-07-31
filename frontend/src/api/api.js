import axios from "axios";

export const ADMIN_UNAUTHORIZED_EVENT =
    "admin-unauthorized";

const DEFAULT_ERROR_MESSAGE =
    "Ett oväntat fel uppstod. Försök igen.";

const MAX_SERVER_MESSAGE_LENGTH =
    300;

const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL
    || "/api";

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401
            && error.config?.url?.startsWith(
                "/admin/"
            )
        ) {
            window.dispatchEvent(
                new CustomEvent(
                    ADMIN_UNAUTHORIZED_EVENT
                )
            );
        }

        error.displayMessage =
            resolveDisplayMessage(
                error
            );

        return Promise.reject(
            error
        );
    }
);

function resolveDisplayMessage(error) {
    const serverMessage =
        error.response?.data?.message;

    if (
        typeof serverMessage === "string"
        && serverMessage.trim().length > 0
        && serverMessage.length
        <= MAX_SERVER_MESSAGE_LENGTH
    ) {
        return serverMessage.trim();
    }

    const status =
        error.response?.status;

    if (status === 401) {
        return "Du behöver logga in igen.";
    }

    if (status === 403) {
        return "Du saknar behörighet "
            + "för åtgärden.";
    }

    if (status === 429) {
        return "För många anrop. "
            + "Försök igen senare.";
    }

    if (
        error.code === "ECONNABORTED"
    ) {
        return "Servern svarade inte i tid. "
            + "Försök igen.";
    }

    if (!error.response) {
        return "Det gick inte att kontakta "
            + "servern. Kontrollera anslutningen.";
    }

    return DEFAULT_ERROR_MESSAGE;
}

export async function initializeCsrf() {
    await api.get(
        "/auth/csrf"
    );
}

export default api;