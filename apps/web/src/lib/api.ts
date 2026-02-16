const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Instance {
  id: string;
  status: "active" | "inactive" | "provisioning" | "error";
  plan: string;
  region: string;
  ip_address: string;
  subdomain: string;
  created_at: string;
  openclaw_version: string;
  health?: {
    uptime_percent: number;
    last_check: string;
  };
}

export interface Metrics {
  cpu: number;
  memory: number;
  disk: number;
  network_in: number;
  network_out: number;
}

export interface AdminStats {
  total_instances: number;
  total_users: number;
  mrr: number;
  uptime_percent: number;
}

class APIClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getToken() {
    return this.token || localStorage.getItem("token");
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Request failed");
    }

    return res.json();
  }

  // Instance endpoints
  getInstance(): Promise<Instance> {
    return this.request("/api/instances/me");
  }

  rebootInstance(id: string): Promise<void> {
    return this.request(`/api/instances/${id}/reboot`, { method: "POST" });
  }

  getMetrics(id: string, period: string): Promise<Metrics[]> {
    return this.request(`/api/instances/${id}/metrics?period=${period}`);
  }

  updateConfig(id: string, config: unknown): Promise<void> {
    return this.request(`/api/instances/${id}/config`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  // Admin endpoints
  getAdminStats(): Promise<AdminStats> {
    return this.request("/api/admin/stats");
  }

  getAdminInstances(params?: { status?: string; page?: number }): Promise<Instance[]> {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/admin/instances?${qs}`);
  }
}

export const api = new APIClient();