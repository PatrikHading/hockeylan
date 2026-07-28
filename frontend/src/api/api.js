import axios from "axios";

export const ADMIN_UNAUTHORIZED_EVENT = "admin-unauthorized";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
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
            error.response?.status === 401 &&
            error.config?.url?.startsWith("/admin/")
        ) {
            window.dispatchEvent(
                new CustomEvent(ADMIN_UNAUTHORIZED_EVENT)
            );
        }

        const message =
            error.response?.data?.message ||
            error.message ||
            "Ett oväntat fel uppstod.";

        error.displayMessage = message;

        return Promise.reject(error);
    }
);

export async function initializeCsrf() {
    await api.get("/auth/csrf");
}

export default api;