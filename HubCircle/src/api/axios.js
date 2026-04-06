import axios from "axios";

const api = axios.create({
    // Use your environment variable or default to localhost
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = ["/auth/login", "/auth/me", "/auth/refresh"].some(path =>
            error.config?.url?.includes(path)
        );

        if (error.response?.status === 401 && !isAuthRoute) {
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
