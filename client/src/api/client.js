import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Tiny pub-sub so code outside axios (AuthContext) can react when a
// session dies mid-request, without every call site checking status
// codes itself.
const sessionExpiredListeners = new Set();
export function onSessionExpired(fn) {
  sessionExpiredListeners.add(fn);
  return () => sessionExpiredListeners.delete(fn);
}

// A 401 from these is an expected, quiet outcome (checking "am I logged
// in", or the login/register forms themselves) — it must not trigger the
// global "your session expired" redirect/banner.
const SILENT_401_PATHS = ['/auth/login', '/auth/register', '/auth/me'];

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    const isSilent = SILENT_401_PATHS.some((path) => url.includes(path));
    if (status === 401 && !isSilent) {
      sessionExpiredListeners.forEach((fn) => fn());
    }
    return Promise.reject(err);
  }
);

export default client;
