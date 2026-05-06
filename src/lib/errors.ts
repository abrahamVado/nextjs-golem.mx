import axios from "axios";

interface ApiErrorBody {
  error?: string | { message?: string };
  message?: string;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const nestedError =
      typeof data?.error === "object" && data?.error !== null
        ? data.error.message
        : undefined;
    const flatError =
      typeof data?.error === "string"
        ? data.error
        : undefined;
    return nestedError || flatError || data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
