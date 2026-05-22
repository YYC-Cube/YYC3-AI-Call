export enum OAuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  GITHUB = 'github',
  DINGTALK = 'dingtalk',
  WECHAT = 'wechat',
  CUSTOM = 'custom',
}

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scopes: string[];
  redirectUri: string;
  extraParams?: Record<string, string>;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: OAuthProvider;
  rawProfile?: Record<string, unknown>;
}

export interface OIDCConfig extends OAuthConfig {
  issuer: string;
  jwksUri: string;
  logoutEndpoint?: string;
}

export interface MFAConfig {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email' | 'fido2')[];
  totpSecretLength?: number;
  totpStep?: number; // seconds
  smsTemplateId?: string;
  emailTemplateId?: string;
  recoveryCodesCount?: number;
}

export interface SessionData {
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  provider: OAuthProvider;
  mfaVerified: boolean;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
  ipAddress: string;
  userAgent: string;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  tokenType: 'Bearer';
}
