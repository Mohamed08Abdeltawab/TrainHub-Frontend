import { isAxiosError } from 'axios';

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ErrorPresentation {
  title: string;
  description: string;
  retryable: boolean;
  statusCode?: number;
  fieldErrors?: Record<string, string>;
  rawErrors?: Record<string, string[]>;
}

/**
 * Extracts and flattens field validation errors from an API error (RFC 7807 ProblemDetails).
 * Returns a dictionary mapping lowercase/camelCase and original property names to the first error message.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error) || !error.response?.data) {
    return {};
  }

  const data = error.response.data as ProblemDetails;
  const rawErrors = data.errors || (data.extensions?.errors as Record<string, string[]> | undefined);
  if (!rawErrors || typeof rawErrors !== 'object') {
    return {};
  }

  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(rawErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      const msg = messages[0];
      fieldErrors[key] = msg;
      // Also provide camelCase version for frontend forms (e.g., 'StartTime' -> 'startTime')
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      fieldErrors[camelKey] = msg;
    } else if (typeof messages === 'string') {
      fieldErrors[key] = messages;
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      fieldErrors[camelKey] = messages;
    }
  }

  return fieldErrors;
}

/**
 * Extracts RFC 7807 ProblemDetails from an API error if available.
 */
export function getProblemDetails(error: unknown): ProblemDetails | null {
  if (!isAxiosError(error) || !error.response?.data) return null;
  const data = error.response.data;
  if (typeof data === 'object' && data !== null) {
    return data as ProblemDetails;
  }
  return null;
}

/**
 * Transforms any API or client error into a user-friendly presentation model,
 * honoring RFC 7807 ProblemDetails attributes (title, detail, status, errors).
 */
export function getErrorPresentation(error: unknown): ErrorPresentation {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const problem = getProblemDetails(error);
    const fieldErrors = getFieldErrors(error);
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;

    if (!error.response) {
      return {
        title: 'Connection problem',
        description: 'Check your internet connection and try again.',
        retryable: true,
      };
    }

    const data = error.response.data as Record<string, unknown> | undefined;
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

    const firstFieldErrorMessage = hasFieldErrors
      ? Object.values(fieldErrors)[0]
      : undefined;

    const detail = customMessage || problem?.detail || firstFieldErrorMessage;

    if (status === 400) {
      return {
        title: problem?.title || 'Invalid request',
        description: detail || 'The request could not be processed due to invalid parameters.',
        retryable: false,
        statusCode: 400,
        fieldErrors,
        rawErrors: problem?.errors,
      };
    }

    if (status === 401) {
      return {
        title: problem?.title || 'Session expired',
        description: detail || 'Sign in again to continue.',
        retryable: false,
        statusCode: 401,
      };
    }

    if (status === 403) {
      return {
        title: problem?.title || 'Access denied',
        description: detail || 'Your account does not have permission to view or modify this information.',
        retryable: false,
        statusCode: 403,
      };
    }

    if (status === 404) {
      return {
        title: problem?.title || 'Not found',
        description: detail || 'The requested information is no longer available.',
        retryable: false,
        statusCode: 404,
      };
    }

    if (status === 409) {
      return {
        title: problem?.title || 'Conflict detected',
        description: detail || 'The request could not be completed because of a conflict with existing data.',
        retryable: false,
        statusCode: 409,
      };
    }

    if (status === 422) {
      return {
        title: problem?.title || 'Validation failed',
        description: detail || 'One or more validation checks failed. Please review your input.',
        retryable: false,
        statusCode: 422,
        fieldErrors,
        rawErrors: problem?.errors,
      };
    }

    if (status === 408 || status === 429) {
      return {
        title: problem?.title || 'Request delayed',
        description: detail || 'The service is taking a break. Wait a moment, then try again.',
        retryable: true,
        statusCode: status,
      };
    }

    if (status && status >= 500) {
      return {
        title: problem?.title || 'Service unavailable',
        description: detail || 'We could not complete your request. Please try again shortly.',
        retryable: true,
        statusCode: status,
      };
    }
  }

  if (error instanceof Error && error.message) {
    return {
      title: 'Something went wrong',
      description: error.message,
      retryable: true,
    };
  }

  return {
    title: 'Something went wrong',
    description: 'We could not complete that request. Please try again.',
    retryable: true,
  };
}

/**
 * Utility to extract a clean error message string from unknown error.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const presentation = getErrorPresentation(error);
  return presentation.description || presentation.title || fallback || 'An unexpected error occurred.';
}
