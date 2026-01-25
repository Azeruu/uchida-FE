// src/utils/authFetch.ts
// import config from "../config";

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
};
