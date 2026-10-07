import { isAxiosError } from 'axios';

export type ErrorPresentation = { title: string; description: string; retryable: boolean };

export function getErrorPresentation(error: unknown): ErrorPresentation {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;

    let customMessage: string | undefined;
    if (data) {
      if (typeof data.detail === 'string' && data.detail.trim()) {
        customMessage = data.detail.trim();
      } else if (data.errors && typeof data.errors === 'object') {
        const errorValues = Object.values(data.errors as Record<string, string[]>).flat();
        if (errorValues.length > 0 && typeof errorValues[0] === 'string') {
          customMessage = errorValues[0];
        }
      } else if (typeof data.message === 'string' && data.message.trim()) {
        customMessage = data.message.trim();
      } else if (typeof data.title === 'string' && data.title.trim() && status !== 500) {
        customMessage = data.title.trim();
      }
    }

    if (!error.response) return { title: 'Connection problem', description: 'Check your internet connection and try again.', retryable: true };
    if (status === 401) return { title: 'Session expired', description: 'Sign in again to continue.', retryable: false };
    if (status === 403) return { title: 'Access denied', description: customMessage || 'Your account does not have permission to view this information.', retryable: false };
    if (status === 404) return { title: 'Not found', description: customMessage || 'The requested information is no longer available.', retryable: false };
    if (status === 409) return { title: 'Conflict', description: customMessage || 'A conflict occurred while processing the request.', retryable: false };
    if (status === 400 || status === 422) return { title: 'Validation error', description: customMessage || 'Please check your input and try again.', retryable: false };
    if (status === 408 || status === 429) return { title: 'Request delayed', description: 'The service is taking a break. Wait a moment, then try again.', retryable: true };
    if (status && status >= 500) return { title: 'Service unavailable', description: 'We could not complete your request. Please try again shortly.', retryable: true };
  }

  return { title: 'Something went wrong', description: 'We could not complete that request. Please try again.', retryable: true };
}
