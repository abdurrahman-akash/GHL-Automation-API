import axios, { AxiosError } from "axios";

type ApiErrorBody = {
  message?: string;
  error?: string;
};

export class ApiClientError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl && process.env.NODE_ENV !== "test") {
  // Surface misconfiguration early in development.
  console.warn("NEXT_PUBLIC_API_BASE_URL is not configured; requests will use relative URLs.");
}

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl ?? "",
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "An unexpected API error occurred.";

    return Promise.reject(new ApiClientError(message, status, error.response?.data));
  }
);

export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
