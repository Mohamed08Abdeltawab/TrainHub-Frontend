import { isAxiosError } from 'axios';

export type ErrorPresentation = { title: string; description: string; retryable: boolean };

export function getErrorPresentation(error: unknown): ErrorPresentation {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) return { title: 'Connection problem', description: 'Check your internet connection and try again.', retryable: true };
    if (status === 401) return { title: 'Session expired', description: 'Sign in again to continue.', retryable: false };
    if (status === 403) return { title: 'Access denied', description: 'Your account does not have permission to view this information.', retryable: false };
    if (status === 404) return { title: 'Not found', description: 'The requested information is no longer available.', retryable: false };
    if (status === 408 || status === 429) return { title: 'Request delayed', description: 'The service is taking a break. Wait a moment, then try again.', retryable: true };
    if (status && status >= 500) return { title: 'Service unavailable', description: 'We could not complete your request. Please try again shortly.', retryable: true };
  }

  return { title: 'Something went wrong', description: 'We could not complete that request. Please try again.', retryable: true };
}
