export interface User {
  id: number;
  username: string;
  password_hash: string;
}

export type RedirectMode = "direct" | "page";
export type StatusCode = 301 | 302 | 307;

export interface Link {
  id: number;
  code: string;
  destination_url: string;
  redirect_mode: RedirectMode;
  status_code: number;
  expires_at: number | null;
  show_ip: number;
  hit_count: number;
  created_at: number;
}

export interface Hit {
  id: number;
  link_id: number;
  ip_address: string | null;
  user_agent: string | null;
  referer: string | null;
  created_at: number;
}

export interface CountRow {
  count: number;
}
