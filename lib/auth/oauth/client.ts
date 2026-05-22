import { OAuthProvider, type OAuthConfig, type OIDCConfig, type OAuthUserInfo, type AuthTokenPair } from './types';
import { oauthProviderRegistry } from './provider-registry';
import { logger } from '../../logger';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

class OAuthClient {
  private stateStore: Map<string, { provider: OAuthProvider; redirectUri: string; timestamp: number }> = new Map();
  private readonly STATE_EXPIRY = 10 * 60 * 1000; // 10分钟

  generateAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string,
    state?: string
  ): string {
    const config = oauthProviderRegistry.getProvider(provider);
    if (!config) {
      throw new Error(`OAuth provider ${provider} is not configured`);
    }

    const authState = state || this.generateRandomState();
    
    this.stateStore.set(authState, {
      provider,
      redirectUri,
      timestamp: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      scope: config.scopes.join(' '),
      redirect_uri: redirectUri,
      state: authState,
      ...config.extraParams,
    });

    return `${config.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    state: string
  ): Promise<{ tokens: AuthTokenPair; userInfo: OAuthUserInfo }> {
    const storedState = this.stateStore.get(state);
    
    if (!storedState) {
      throw new Error('Invalid or expired state parameter');
    }

    if (Date.now() - storedState.timestamp > this.STATE_EXPIRY) {
      this.stateStore.delete(state);
      throw new Error('State parameter has expired');
    }

    this.stateStore.delete(state);

    const config = oauthProviderRegistry.getProvider(storedState.provider);
    if (!config) {
      throw new Error(`OAuth provider ${storedState.provider} is not configured`);
    }

    const tokenResponse = await this.fetchTokens(config, code, storedState.redirectUri);
    const userInfo = await this.fetchUserInfo(config, tokenResponse);

    logger.info('OAuth token exchange successful', {
      provider: config.provider,
      userId: userInfo.id,
      email: userInfo.email,
    });

    return {
      tokens: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || '',
        accessTokenExpiresIn: tokenResponse.expires_in,
        refreshTokenExpiresIn: tokenResponse.refresh_token ? 30 * 24 * 60 * 60 : 0,
        tokenType: 'Bearer',
      },
      userInfo,
    };
  }

  async refreshAccessToken(refreshToken: string, provider: OAuthProvider): Promise<AuthTokenPair> {
    const config = oauthProviderRegistry.getProvider(provider);
    if (!config) {
      throw new Error(`OAuth provider ${provider} is not configured`);
    }

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        accessTokenExpiresIn: data.expires_in,
        refreshTokenExpiresIn: 30 * 24 * 60 * 60,
        tokenType: data.token_type as 'Bearer',
      };
    } catch (error) {
      logger.error('Failed to refresh OAuth token', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async fetchTokens(
    config: OAuthConfig,
    code: string,
    redirectUri: string
  ): Promise<TokenResponse> {
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange authorization code: ${errorText}`);
    }

    return response.json() as Promise<TokenResponse>;
  }

  private async fetchUserInfo(
    config: OAuthConfig,
    tokenResponse: TokenResponse
  ): Promise<OAuthUserInfo> {
    if (!config.userInfoEndpoint) {
      throw new Error('User info endpoint not configured');
    }

    try {
      const response = await fetch(config.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const profile = await response.json();
      
      return this.normalizeUserProfile(profile, config.provider);
    } catch (error) {
      logger.error('Failed to fetch user info', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private normalizeUserProfile(
    profile: Record<string, unknown>,
    provider: OAuthProvider
  ): OAuthUserInfo {
    switch (provider) {
      case OAuthProvider.GOOGLE:
        return {
          id: profile.sub as string,
          email: profile.email as string,
          name: (profile.name as string) || undefined,
          picture: (profile.picture as string) || undefined,
          provider,
          rawProfile: profile,
        };

      case OAuthProvider.MICROSOFT:
        return {
          id: profile.id as string || (profile.sub as string),
          email: (profile.mail as string) || (profile.userPrincipalName as string) || '',
          name: (profile.displayName as string) || undefined,
          picture: undefined,
          provider,
          rawProfile: profile,
        };

      case OAuthProvider.GITHUB:
        return {
          id: String(profile.id),
          email: (profile.email as string) || '',
          name: (profile.name as string) || (profile.login as string) || undefined,
          picture: (profile.avatar_url as string) || undefined,
          provider,
          rawProfile: profile,
        };

      case OAuthProvider.DINGTALK:
        return {
          id: (profile.unionid as string) || (profile.userid as string) || '',
          email: (profile.email as string) || '',
          name: (profile.nickname as string) || (profile.name as string) || undefined,
          picture: (profile.avatarUrl as string) || undefined,
          provider,
          rawProfile: profile,
        };

      case OAuthProvider.WECHAT:
        return {
          id: (profile.openid as string) || (profile.unionid as string) || '',
          email: '',
          name: (profile.nickname as string) || undefined,
          picture: (profile.headimgurl as string) || undefined,
          provider,
          rawProfile: profile,
        };

      default:
        return {
          id: (profile.id as string) || (profile.sub as string) || '',
          email: (profile.email as string) || '',
          name: (profile.name as string) || undefined,
          picture: (profile.picture as string) || (profile.avatar_url as string) || undefined,
          provider,
          rawProfile: profile,
        };
    }
  }

  private generateRandomState(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const oauthClient = new OAuthClient();
