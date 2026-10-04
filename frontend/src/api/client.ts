import axios from "axios";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (error.code === "ECONNABORTED") {
      return "The request took too long. Please try again.";
    }
    if (!error.response) {
      return "Could not reach the SiteSnap server. Please check your connection.";
    }
  }
  return fallback;
}
