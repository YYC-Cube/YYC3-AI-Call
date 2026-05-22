import { OAuthProvider, type OAuthConfig, type OIDCConfig } from './types';

class OAuthProviderRegistry {
  private providers: Map<OAuthProvider, OAuthConfig> = new Map();

  registerProvider(config: OAuthConfig): void {
    if (this.providers.has(config.provider)) {
      throw new Error(`OAuth provider ${config.provider} is already registered`);
    }

    this.validateConfig(config);
    this.providers.set(config.provider, config);
  }

  getProvider(provider: OAuthProvider): OAuthConfig | null {
    return this.providers.get(provider) || null;
  }

  getAllProviders(): OAuthConfig[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): OAuthConfig[] {
    const enabledProviders: string[] = (process.env.ENABLED_OAUTH_PROVIDERS || '').split(',').filter(Boolean);
    
    if (enabledProviders.length === 0) {
      return this.getAllProviders();
    }

    return enabledProviders
      .map(p => p.trim() as OAuthProvider)
      .map(p => this.getProvider(p))
      .filter((p): p is OAuthConfig => p !== null);
  }

  isProviderEnabled(provider: OAuthProvider): boolean {
    return this.getProvider(provider) !== null;
  }

  private validateConfig(config: OAuthConfig): void {
    if (!config.clientId || !config.clientSecret) {
      throw new Error(`Invalid OAuth config for ${config.provider}: missing credentials`);
    }

    if (!config.authorizationEndpoint || !config.tokenEndpoint) {
      throw new Error(`Invalid OAuth config for ${config.provider}: missing endpoints`);
    }

    if (!config.scopes || config.scopes.length === 0) {
      throw new Error(`Invalid OAuth config for ${config.provider}: no scopes defined`);
    }
  }
}

export const oauthProviderRegistry = new OAuthProviderRegistry();
export { OAuthProviderRegistry };
