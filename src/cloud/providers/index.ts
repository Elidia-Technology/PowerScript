/**
 * Cloud Provider Exports
 * Centralized export for all cloud providers
 */

export { BaseCloudProvider } from './BaseProvider';
export { AWSProvider } from './AWSProvider';
export { GCPProvider } from './GCPProvider';
export { AzureProvider } from './AzureProvider';
export { VercelProvider } from './VercelProvider';
export { NetlifyProvider } from './NetlifyProvider';
export { EdgeProvider } from './EdgeProvider';

// Provider registry for dynamic loading
export const CLOUD_PROVIDERS = {
    aws: () => import('./AWSProvider').then(m => m.AWSProvider),
    gcp: () => import('./GCPProvider').then(m => m.GCPProvider),
    azure: () => import('./AzureProvider').then(m => m.AzureProvider),
    vercel: () => import('./VercelProvider').then(m => m.VercelProvider),
    netlify: () => import('./NetlifyProvider').then(m => m.NetlifyProvider),
    edge: () => import('./EdgeProvider').then(m => m.EdgeProvider),
    cloudflare: () => import('./EdgeProvider').then(m => m.EdgeProvider), // Alias for edge
    deno: () => import('./EdgeProvider').then(m => m.EdgeProvider), // Alias for edge
    bun: () => import('./EdgeProvider').then(m => m.EdgeProvider) // Alias for edge
} as const;

export type ProviderName = keyof typeof CLOUD_PROVIDERS;