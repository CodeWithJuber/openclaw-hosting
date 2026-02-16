// apps/api/src/services/hetzner.ts

const HETZNER_API_BASE = "https://api.hetzner.cloud/v1";

export interface HetznerServer {
  id: number;
  name: string;
  status: string;
  server_type: {
    id: number;
    name: string;
    cores: number;
    memory: number;
    disk: number;
  };
  public_net: {
    ipv4: {
      ip: string;
      blocked: boolean;
    };
    ipv6: {
      ip: string;
      blocked: boolean;
    };
  };
  datacenter: {
    id: number;
    name: string;
    location: {
      id: number;
      name: string;
    };
  };
}

export interface CreateServerResponse {
  server: HetznerServer;
  root_password: string;
}

export interface HetznerAction {
  id: number;
  command: string;
  status: string;
  progress: number;
  started: string;
  finished: string | null;
}

// Server type mapping by plan
export const PLAN_TO_SERVER_TYPE: Record<string, string> = {
  starter: "cpx21",        // 2 vCPU, 4 GB RAM, 80 GB NVMe
  professional: "cpx31",   // 4 vCPU, 8 GB RAM, 160 GB NVMe
  enterprise: "cpx41",     // 8 vCPU, 16 GB RAM, 240 GB NVMe
};

// Region mapping to Hetzner locations
export const REGION_TO_LOCATION: Record<string, string> = {
  "us-east": "ash",        // Ashburn
  "us-west": "hil",        // Hillsboro
  "eu-frankfurt": "fsn1",  // Falkenstein
  "eu-helsinki": "hel1",   // Helsinki
  "sg-singapore": "sin",   // Singapore
  "jp-tokyo": "nbg1",      // Nuremberg (fallback)
};

export class HetznerService {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = HETZNER_API_BASE;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(`Hetzner API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async createServer(params: {
    name: string;
    server_type: string;
    location: string;
    image?: string;
    user_data?: string;
    ssh_keys?: number[];
    labels?: Record<string, string>;
  }): Promise<CreateServerResponse> {
    const body = {
      name: params.name,
      server_type: params.server_type,
      location: params.location,
      image: params.image || "ubuntu-22.04",
      user_data: params.user_data,
      ssh_keys: params.ssh_keys,
      labels: {
        managed_by: "openclaw",
        ...params.labels,
      },
    };

    return this.request<CreateServerResponse>("/servers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async deleteServer(id: number): Promise<void> {
    await this.request(`/servers/${id}`, {
      method: "DELETE",
    });
  }

  async getServer(id: number): Promise<{ server: HetznerServer }> {
    return this.request(`{/servers/${id}`);
  }

  async listServers(labels?: Record<string, string>): Promise<{ servers: HetznerServer[] }> {
    const params = new URLSearchParams();
    
    if (labels) {
      Object.entries(labels).forEach(([key, value]) => {
        params.append("label_selector", `${key}=${value}`);
      });
    }
    
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/servers${query}`);
  }

  // Power actions
  async powerOff(id: number): Promise<{ action: HetznerAction }> {
    return this.request(`/servers/${id}/actions/poweroff`, {
      method: "POST",
    });
  }

  async powerOn(id: number): Promise<{ action: HetznerAction }> {
    return this.request(`/servers/${id}/actions/poweron`, {
      method: "POST",
    });
  }

  async reboot(id: number): Promise<{ action: HetznerAction }> {
    return this.request(`/servers/${id}/actions/reboot`, {
      method: "POST",
    });
  }

  async shutdown(id: number): Promise<{ action: HetznerAction }> {
    return this.request(`/servers/${id}/actions/shutdown`, {
      method: "POST",
    });
  }

  // Reset root password
  async resetPassword(id: number): Promise<{ action: HetznerAction; root_password: string }> {
    return this.request(`/servers/${id}/actions/reset_password`, {
      method: "POST",
    });
  }

  // Resize (requires shutdown first)
  async changeType(id: number, serverType: string, upgradeDisk: boolean = false): Promise<{ action: HetznerAction }> {
    return this.request(`/servers/${id}/actions/change_type`, {
      method: "POST",
      body: JSON.stringify({
        server_type: serverType,
        upgrade_disk: upgradeDisk,
      }),
    });
  }

  // SSH Keys
  async createSSHKey(name: string, publicKey: string): Promise<{ ssh_key: { id: number; name: string; fingerprint: string } }> {
    return this.request("/ssh_keys", {
      method: "POST",
      body: JSON.stringify({
        name,
        public_key: publicKey,
      }),
    });
  }

  async deleteSSHKey(id: number): Promise<void> {
    await this.request(`/ssh_keys/${id}`, {
      method: "DELETE",
    });
  }

  // Server Types (for validation)
  async listServerTypes(): Promise<{ server_types: Array<{
    id: number;
    name: string;
    cores: number;
    memory: number;
    disk: number;
    prices: Array<{ location: string; price_monthly: { net: string } }>;
  }> }> {
    return this.request("/server_types");
  }

  // Locations
  async listLocations(): Promise<{ locations: Array<{
    id: number;
    name: string;
    city: string;
    country: string;
  }> }> {
    return this.request("/locations");
  }
}
