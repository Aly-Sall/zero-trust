import axios from "axios";

const api = axios.create({
  // On met la vraie URL de ton API .NET ici :
  baseURL: "http://localhost:5162/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
