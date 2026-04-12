import axios from 'axios';

// Get the API URL from environment variables or use localhost as fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add Interceptor to attach Auth Token to every request
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            config.headers.Authorization = `Bearer ${token || 'mock-token'}`;
        } else if (import.meta.env.MODE === 'development') {
            // Include mock token in dev if user is not logged in but we're testing
            config.headers.Authorization = `Bearer mock-token`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
