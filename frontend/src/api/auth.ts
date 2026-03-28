import client from "./client";

export interface AuthTokens {
  access: string;
  refresh: string;
  user: { id: string; email: string; is_onboarding_complete: boolean };
}

export const register = (email: string, password: string) =>
  client.post<AuthTokens>("/auth/register/", { email, password });

export const login = (email: string, password: string) =>
  client.post<AuthTokens>("/auth/login/", { email: email, password });

export const logout = (refresh: string) =>
  client.post("/auth/logout/", { refresh });

export const getMe = () =>
  client.get<AuthTokens["user"]>("/auth/me/");
