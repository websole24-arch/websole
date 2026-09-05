// Turns an axios error into a message worth showing an admin. Always
// prefers the server's own message (see server/src/middleware/errorHandler.js)
// so field-level and business-rule errors stay specific — only falls back to
// a generic line when the server gave nothing useful (network failure, a
// non-JSON 5xx from a proxy, etc).
export function describeApiError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err?.response) {
    return "Can't reach the server. Check your connection and try again.";
  }

  const { status, data } = err.response;
  const serverMessage = data?.message;

  if (status === 401) return serverMessage || 'Your session has expired. Please log in again.';
  if (status === 403) return serverMessage || "You don't have permission to do that.";
  if (status === 404) return serverMessage || "That couldn't be found — it may have been removed.";
  if (status === 429) return serverMessage || 'Too many requests — please wait a moment and try again.';
  if (status >= 500) return serverMessage || 'The server ran into a problem. Please try again shortly.';

  return serverMessage || fallback;
}
