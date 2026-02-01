export interface LoginRequest {
  memberEmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}
