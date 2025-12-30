const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      cache: 'no-cache', // Prevent browser caching
    });

    if (!response.ok) {
      // Read response as text first, then try to parse as JSON
      const text = await response.text();
      let error;
      
      try {
        error = JSON.parse(text);
      } catch (e) {
        // If not JSON, use the text as error message
        throw new Error(`Server error (${response.status}): ${text || 'An error occurred'}`);
      }
      
      // Handle DRF validation errors (field-specific errors)
      if (typeof error === 'object' && !error.detail && !error.message) {
        // This is likely a validation error with field names as keys
        const fieldErrors = Object.entries(error)
          .map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          })
          .join('; ');
        throw new Error(fieldErrors || JSON.stringify(error));
      }
      
      // Include validation errors if present
      const errorMessage = error.detail || error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error) {
    // Handle network errors (fetch failures)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Unable to connect to the server. Please ensure the backend is running at ${API_URL}`);
    }
    // Re-throw other errors
    throw error;
  }
}

// Typed API methods
export const api = {
  get: <T>(endpoint: string, token?: string) =>
    apiClient<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, data: unknown, token?: string) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  put: <T>(endpoint: string, data: unknown, token?: string) =>
    apiClient<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  patch: <T>(endpoint: string, data: unknown, token?: string) =>
    apiClient<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  delete: <T>(endpoint: string, token?: string) =>
    apiClient<T>(endpoint, { method: 'DELETE', token }),
};
