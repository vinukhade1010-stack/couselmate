import axios from 'axios';

// withCredentials sends the login cookie. The custom header is our CSRF protection:
// the server rejects any POST/PUT/DELETE that does not carry it.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'X-Requested-With': 'CounselMate' },
  timeout: 20000,
});

/** A message that is safe to show a student. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that it is running.';
  if (err?.code === 'ECONNABORTED') return 'The server took too long to answer. Try again.';
  return fallback;
}

export default api;
