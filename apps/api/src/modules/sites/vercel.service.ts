import { Injectable, Logger } from "@nestjs/common";

export interface VercelAddDomainResponse {  name?: string;
  apexName?: string;
  projectId?: string;
  verified?: boolean;
  verification?: { type: string; domain: string; value: string; reason: string }[];
  error?: { code: string; message: string };
}

export interface VercelDomainConfig {
  misconfigured?: boolean;
  verified?: boolean;
  ns?: string[];
  cnames?: string[];
  nameservers?: string[];
  intendedNameservers?: string[];
  error?: { code: string; message: string };
}

@Injectable()
export class VercelService {
  private readonly logger = new Logger(VercelService.name);
  private readonly apiBase = "https://api.vercel.com";

  get projectId(): string {
    return process.env.VERCEL_PROJECT_ID || "";
  }

  get token(): string {
    return process.env.VERCEL_TOKEN || "";
  }

  get isConfigured(): boolean {
    return Boolean(this.token && this.projectId);
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async addDomain(domain: string): Promise<VercelAddDomainResponse> {
    if (!this.isConfigured) {
      this.logger.warn("VERCEL_TOKEN / VERCEL_PROJECT_ID not configured; skipping addDomain");
      return { error: { code: "not_configured", message: "Vercel integration is not configured" } };
    }
    try {
      const res = await fetch(`${this.apiBase}/v10/projects/${this.projectId}/domains`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ name: domain }),
      });
      const data: VercelAddDomainResponse = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.logger.warn(`Vercel addDomain failed (${res.status}): ${JSON.stringify(data)}`);
        return data;
      }
      this.logger.log(`Vercel domain added: ${domain} (verified=${data.verified})`);
      return data;
    } catch (err: any) {
      this.logger.error(`Vercel addDomain error: ${err.message}`);
      return { error: { code: "vercel_request_failed", message: err.message } };
    }
  }

  async removeDomain(domain: string): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      const res = await fetch(`${this.apiBase}/v9/projects/${this.projectId}/domains/${domain}`, {
        method: "DELETE",
        headers: this.headers(),
      });
      if (res.ok || res.status === 404) {
        this.logger.log(`Vercel domain removed: ${domain}`);
        return true;
      }
      this.logger.warn(`Vercel removeDomain failed (${res.status})`);
      return false;
    } catch (err: any) {
      this.logger.error(`Vercel removeDomain error: ${err.message}`);
      return false;
    }
  }

  async getDomainConfig(domain: string): Promise<VercelDomainConfig> {
    if (!this.isConfigured) {
      return { error: { code: "not_configured", message: "Vercel integration is not configured" } };
    }
    try {
      const res = await fetch(`${this.apiBase}/v6/domains/${domain}/config`, {
        method: "GET",
        headers: this.headers(),
      });
      const data: VercelDomainConfig = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.logger.warn(`Vercel getDomainConfig failed (${res.status}): ${JSON.stringify(data)}`);
        return data;
      }
      return data;
    } catch (err: any) {
      this.logger.error(`Vercel getDomainConfig error: ${err.message}`);
      return { error: { code: "vercel_request_failed", message: err.message } };
    }
  }
}
