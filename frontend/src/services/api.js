/**
 * FocusGuard AI — Central API & Socket Configuration
 * Seamlessly supports Local Dev (Vite 5173), Docker Nginx (Port 80/3000),
 * and Cloud Production Deployments.
 */

// Determine base API URL dynamically
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // When running locally on Vite dev server without proxy override
  if (typeof window !== "undefined" && (window.location.port === "5173" || window.location.port === "5174")) {
    return "http://localhost:5000";
  }
  // When running on Vercel or public domain without reverse proxy
  if (typeof window !== "undefined" && (window.location.hostname.includes("vercel.app") || window.location.hostname !== "localhost")) {
    return "https://focusguard-backend-2hmz.onrender.com";
  }
  // When running behind Nginx / Docker / Production local container
  return "";
};

export const BACKEND_URL = getApiBase();
export const API_URL = `${BACKEND_URL}/api`;
export const API_MONITORING = `${API_URL}/monitoring`;
export const API_AUTH = `${API_URL}/auth`;
export const API_USERS = `${API_URL}/users`;
export const API_GOALS = `${API_URL}/goals`;

// Socket.io connection URL
export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== "undefined" && (window.location.port === "5173" || window.location.port === "5174")) {
    return "http://localhost:5000";
  }
  if (typeof window !== "undefined" && (window.location.hostname.includes("vercel.app") || window.location.hostname !== "localhost")) {
    return "https://focusguard-backend-2hmz.onrender.com";
  }
  return typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
};

export default API_URL;
