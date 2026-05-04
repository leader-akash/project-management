/**
 * Turn API/network errors into short, user-readable messages.
 * @param {unknown} error
 * @returns {string}
 */
export function formatApiError(error) {
  if (!error) return "Something went wrong. Please try again.";
  const status = error.status ?? error.statusCode;
  const raw = typeof error.message === "string" ? error.message.trim() : "";

  if (status === 0) {
    return raw || "We could not reach the server. Check your connection and try again.";
  }
  if (status === 401) {
    return raw || "Your session expired. Please sign in again.";
  }
  if (status === 403) {
    return raw || "You do not have permission to do that.";
  }
  if (status === 404) {
    return raw || "That item could not be found.";
  }
  if (status === 409) {
    return raw || "Someone else changed this. Refresh the page and try again.";
  }
  if (status === 400) {
    return raw || "We could not apply that change. Check your input and try again.";
  }
  if (status >= 500) {
    return "The server had a problem. Please try again in a moment.";
  }

  return raw || "Request failed. Please try again.";
}
