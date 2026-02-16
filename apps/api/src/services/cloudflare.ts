// apps/api/src/services/cloudflare.ts

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

export interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  created_on: string;
  modified_on: string;
}

export interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

export class CloudflareService {
  private token: string;
  private zoneId: string;
  private baseUrl: string;

  constructor(token: string, zoneId: string) {
    this.token = token;
    this.zoneId = zoneId;
    this.baseUrl = CLOUDFLARE_API_BASE;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CloudflareResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json() as CloudflareResponse<T>;

    if (!response.ok || !data.success) {
      const errorMessage = data.errors?.[0]?.message || "Unknown Cloudflare error";
      throw new Error(`Cloudflare API error: ${errorMessage}`);
    }

    return data;
  }

  /**
   * Create an A record for a subdomain
   */
  async createARecord(
    subdomain: string,
    ipAddress: string,
    ttl: number = 300,
    proxied: boolean = false
  ): Promise<string> {
    const domain = process.env.CLOUDFLARE_DOMAIN;
    if (!domain) {
      throw new Error("CLOUDFLARE_DOMAIN environment variable is required");
    }

    const name = `${subdomain}.${domain}`;

    const response = await this.request<CloudflareDNSRecord>(
      `/zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        body: JSON.stringify({
          type: "A",
          name,
          content: ipAddress,
          ttl,
          proxied,
          comment: `OpenClaw instance: ${subdomain}`,
        }),
      }
    );

    return response.result.id;
  }

  /**
   * Create a CNAME record
   */
  async createCNAMERecord(
    subdomain: string,
    target: string,
    ttl: number = 300,
    proxied: boolean = false
  ): Promise<string> {
    const domain = process.env.CLOUDFLARE_DOMAIN;
    if (!domain) {
      throw new Error("CLOUDFLARE_DOMAIN environment variable is required");
    }

    const name = `${subdomain}.${domain}`;

    const response = await this.request<CloudflareDNSRecord>(
      `/zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        body: JSON.stringify({
          type: "CNAME",
          name,
          content: target,
          ttl,
          proxied,
          comment: `OpenClaw CNAME: ${subdomain}`,
        }),
      }
    );

    return response.result.id;
  }

  /**
   * Delete a DNS record
   */
  async deleteRecord(recordId: string): Promise<boolean> {
    try {
      await this.request(`/zones/${this.zoneId}/dns_records/${recordId}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete DNS record ${recordId}:`, error);
      return false;
    }
  }

  /**
   * Get a DNS record by ID
   */
  async getRecord(recordId: string): Promise<CloudflareDNSRecord | null> {
    try {
      const response = await this.request<CloudflareDNSRecord>(
        `/zones/${this.zoneId}/dns_records/${recordId}`
      );
      return response.result;
    } catch {
      return null;
    }
  }

  /**
   * Update a DNS record
   */
  async updateRecord(
    recordId: string,
    updates: Partial<Omit<CloudflareDNSRecord, "id" | "created_on" | "modified_on">>
  ): Promise<CloudflareDNSRecord> {
    const response = await this.request<CloudflareDNSRecord>(
      `/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      }
    );

    return response.result;
  }

  /**
   * List DNS records with optional filters
   */
  async listRecords(filters?: {
    type?: string;
    name?: string;
    content?: string;
  }): Promise<CloudflareDNSRecord[]> {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append("type", filters.type);
    if (filters?.name) params.append("name", filters.name);
    if (filters?.content) params.append("content", filters.content);

    const query = params.toString() ? `?${params.toString()}` : "";
    
    const response = await this.request<CloudflareDNSRecord[]>(
      `/zones/${this.zoneId}/dns_records${query}`
    );

    return response.result;
  }

  /**
   * Find a record by subdomain name
   */
  async findRecordByName(subdomain: string): Promise<CloudflareDNSRecord | null> {
    const domain = process.env.CLOUDFLARE_DOMAIN;
    if (!domain) {
      throw new Error("CLOUDFLARE_DOMAIN environment variable is required");
    }

    const name = `${subdomain}.${domain}`;
    const records = await this.listRecords({ name });
    
    return records[0] || null;
  }

  /**
   * Verify zone access
   */
  async verifyZone(): Promise<boolean> {
    try {
      const response = await this.request(`{/zones/${this.zoneId}`);
      return response.success;
    } catch {
      return false;
    }
  }
}
