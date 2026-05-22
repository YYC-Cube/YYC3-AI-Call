import { NextRequest, NextResponse } from 'next/server';
import { OAuthProvider, type AuthTokenPair, type OAuthUserInfo } from '@/lib/auth/oauth/types';
import { oauthClient } from '@/lib/auth/oauth/client';
import { mfaManager } from '@/lib/auth/oauth/mfa';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') as OAuthProvider;
  const redirectUri = searchParams.get('redirectUri') || `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`;

  if (!provider) {
    return NextResponse.json(
      { success: false, error: 'OAuth provider is required' },
      { status: 400 }
    );
  }

  try {
    const authorizationUrl = oauthClient.generateAuthorizationUrl(provider, redirectUri);

    return NextResponse.json({
      success: true,
      data: { authorizationUrl },
    });
  } catch (error) {
    logger.error('Failed to generate authorization URL', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'callback':
        return handleCallback(params);

      case 'refresh-token':
        return handleTokenRefresh(params);

      case 'mfa/setup-totp':
        return handleTOTPSetup(params);

      case 'mfa/verify-totp':
        return handleTOTPVerify(params);

      case 'mfa/send-sms':
        return handleSendSMSCode(params);

      case 'mfa/send-email':
        return handleSendEmailCode(params);

      case 'mfa/verify-code':
        return handleVerifyCode(params);

      case 'mfa/verify-recovery-code':
        return handleVerifyRecoveryCode(params);

      case 'mfa/check-required':
        return handleCheckMFARequired(params);

      case 'mfa/disable':
        return handleDisableMFA(params);

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('OAuth API error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCallback(params: Record<string, unknown>) {
  const { code, state } = params as { code?: string; state?: string };

  if (!code || !state) {
    return NextResponse.json(
      { success: false, error: 'Authorization code and state are required' },
      { status: 400 }
    );
  }

  try {
    const result = await oauthClient.exchangeCodeForTokens(code, state);
    
    // 检查是否需要MFA
    const mfaCheck = await mfaManager.checkMFARequired(result.userInfo.id);

    if (mfaCheck.required) {
      // 返回临时token，等待MFA验证完成后再发放完整token
      // 实际实现中应使用临时session或pending状态
      return NextResponse.json({
        success: true,
        requiresMFA: true,
        mfaMethods: mfaCheck.methods,
        tempUserId: result.userInfo.id,
        userInfo: result.userInfo,
      });
    }

    // 生成应用JWT token（此处简化，实际应调用JWT服务）
    const appTokens = await generateAppTokens(result.userInfo);

    logger.info('User authenticated via OAuth', {
      provider: result.userInfo.provider,
      userId: result.userInfo.id,
      email: result.userInfo.email,
    });

    return NextResponse.json({
      success: false,
      requiresMFA: false,
      tokens: appTokens,
      user: result.userInfo,
    });
  } catch (error) {
    logger.error('OAuth callback failed', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

async function handleTokenRefresh(params: Record<string, unknown>) {
  const { refreshToken, provider } = params as { refreshToken?: string; provider?: OAuthProvider };

  if (!refreshToken || !provider) {
    return NextResponse.json(
      { success: false, error: 'Refresh token and provider are required' },
      { status: 400 }
    );
  }

  try {
    const newTokens = await oauthClient.refreshAccessToken(refreshToken, provider);

    return NextResponse.json({
      success: true,
      data: newTokens,
    });
  } catch (error) {
    logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to refresh token' },
      { status: 401 }
    );
  }
}

async function handleTOTPSetup(params: Record<string, unknown>) {
  const { userId } = params as { userId?: string };

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const setupData = await mfaManager.setupTOTP(userId);

    return NextResponse.json({
      success: true,
      data: setupData,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error instanceof Error) ? error.message : 'TOTP setup failed' },
      { status: 400 }
    );
  }
}

async function handleTOTPVerify(params: Record<string, unknown>) {
  const { userId, token } = params as { userId?: string; token?: string };

  if (!userId || !token) {
    return NextResponse.json(
      { success: false, error: 'userId and token are required' },
      { status: 400 }
    );
  }

  const isValid = await mfaManager.verifyTOTP(userId, token);

  return NextResponse.json({
    success: isValid,
    message: isValid ? 'TOTP verified successfully' : 'Invalid TOTP token',
  });
}

async function handleSendSMSCode(params: Record<string, unknown>) {
  const { userId, phoneNumber } = params as { userId?: string; phoneNumber?: string };

  if (!userId || !phoneNumber) {
    return NextResponse.json(
      { success: false, error: 'userId and phoneNumber are required' },
      { status: 400 }
    );
  }

  const sent = await mfaManager.sendSMSCode(userId, phoneNumber);

  return NextResponse.json({
    success: sent,
    message: sent ? 'SMS code sent successfully' : 'Failed to send SMS code',
  });
}

async function handleSendEmailCode(params: Record<string, unknown>) {
  const { userId, email } = params as { userId?: string; email?: string };

  if (!userId || !email) {
    return NextResponse.json(
      { success: false, error: 'userId and email are required' },
      { status: 400 }
    );
  }

  const sent = await mfaManager.sendEmailCode(userId, email);

  return NextResponse.json({
    success: sent,
    message: sent ? 'Email code sent successfully' : 'Failed to send email code',
  });
}

async function handleVerifyCode(params: Record<string, unknown>) {
  const { userId, method, code } = params as {
    userId?: string;
    method?: 'sms' | 'email';
    code?: string;
  };

  if (!userId || !method || !code) {
    return NextResponse.json(
      { success: false, error: 'userId, method, and code are required' },
      { status: 400 }
    );
  }

  const isValid = await mfaManager.verifyCode(userId, method, code);

  return NextResponse.json({
    success: isValid,
    message: isValid ? 'Code verified successfully' : 'Invalid or expired code',
  });
}

async function handleVerifyRecoveryCode(params: Record<string, unknown>) {
  const { userId, code } = params as { userId?: string; code?: string };

  if (!userId || !code) {
    return NextResponse.json(
      { success: false, error: 'userId and recovery code are required' },
      { status: 400 }
    );
  }

  const isValid = await mfaManager.verifyRecoveryCode(userId, code);

  return NextResponse.json({
    success: isValid,
    message: isValid ? 'Recovery code verified successfully' : 'Invalid recovery code',
  });
}

async function handleCheckMFARequired(params: Record<string, unknown>) {
  const { userId } = params as { userId?: string };

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  const result = await mfaManager.checkMFARequired(userId);

  return NextResponse.json({
    success: true,
    data: result,
  });
}

async function handleDisableMFA(params: Record<string, unknown>) {
  const { userId, currentPassword } = params as { userId?: string; currentPassword?: string };

  if (!userId || !currentPassword) {
    return NextResponse.json(
      { success: false, error: 'userId and currentPassword are required' },
      { status: 400 }
    );
  }

  const disabled = await mfaManager.disableMFAForUser(userId, currentPassword);

  return NextResponse.json({
    success: disabled,
    message: disabled ? 'MFA disabled successfully' : 'Failed to disable MFA',
  });
}

async function generateAppTokens(userInfo: OAuthUserInfo): Promise<AuthTokenPair> {
  // TODO: 集成JWT生成逻辑
  // 这里返回模拟数据，实际应调用JWT service
  
  return {
    accessToken: `app_access_token_${Date.now()}`,
    refreshToken: `app_refresh_token_${Date.now()}`,
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 30 * 24 * 60 * 60,
    tokenType: 'Bearer',
  };
}
