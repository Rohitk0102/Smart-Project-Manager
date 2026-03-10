import axios from 'axios';

let clerkTokenGetter = null;

export const setClerkTokenGetter = (getter) => {
    clerkTokenGetter = getter;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api',
});

api.interceptors.request.use(
    async (config) => {
        if (clerkTokenGetter) {
            const token = await clerkTokenGetter();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
