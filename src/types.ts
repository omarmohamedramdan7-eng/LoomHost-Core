/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HostedSite {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
  createdAt: string;
  visitorsCount: number;
  customDomain?: string;
  
  // Fully Automated SaaS Platform Extensions
  githubRepo?: string;
  vercelUrl?: string;
  modelUsed?: string;
  tenantId?: string;
  dnsStatus?: "active" | "pending";
  sslStatus?: "secured" | "activating";
  supabaseDbStatus?: "connected" | "synced" | "error";
  deploymentLogs?: string[];

  // Uptime monitoring fields
  uptimeStatus?: "Active" | "Down";
  responseTimeMs?: number;
  lastChecked?: string;
}

export interface GenerationResponse {
  html: string;
  css: string;
  js: string;
  explanation: string;
  name: string;
  description: string;
}
