import { type MFAConfig } from './types';
import { logger } from '../../logger';

interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

class MFAManager {
  private config: MFAConfig;

  constructor(config?: Partial<MFAConfig>) {
    this.config = {
      enabled: config?.enabled ?? false,
      methods: config?.methods || ['totp'],
      totpSecretLength: config?.totpSecretLength || 32,
      totpStep: config?.totpStep || 30,
      recoveryCodesCount: config?.recoveryCodesCount || 10,
    };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getAvailableMethods(): string[] {
    return this.config.methods;
  }

  async setupTOTP(userId: string): Promise<TOTPSetup> {
    if (!this.config.methods.includes('totp')) {
      throw new Error('TOTP method is not enabled');
    }

    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    const issuer = encodeURIComponent(process.env.APP_NAME || 'YYC3 AI Calling');
    const userIdentifier = await this.getUserEmail(userId);
    
    const otpauth = `otpauth://totp/${issuer}:${userIdentifier}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=${this.config.totpStep}`;

    logger.info('TOTP setup initiated', { userId });

    return {
      secret,
      qrCodeUrl: otpauth,
      backupCodes,
    };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    try {
      const storedSecret = await this.getStoredSecret(userId);
      
      if (!storedSecret) {
        throw new Error('TOTP not set up for user');
      }

      const isValid = await this.validateTOTPToken(storedSecret, token);

      if (isValid) {
        logger.info('TOTP verification successful', { userId });
        await this.recordMFASuccess(userId, 'totp');
      } else {
        logger.warn('TOTP verification failed', { userId });
        await this.recordMFAFailure(userId, 'totp');
      }

      return isValid;
    } catch (error) {
      logger.error('TOTP verification error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async sendSMSCode(userId: string, phoneNumber: string): Promise<boolean> {
    if (!this.config.methods.includes('sms')) {
      throw new Error('SMS method is not enabled');
    }

    try {
      const code = this.generateVerificationCode(6);
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟有效期

      await this.storeVerificationCode(userId, 'sms', code, expiresAt);

      // TODO: 集成短信服务发送验证码
      // await smsService.send(phoneNumber, `您的验证码是: ${code}，5分钟内有效。`);

      logger.info('SMS verification code sent', { userId, phoneNumber });

      return true;
    } catch (error) {
      logger.error('Failed to send SMS code', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async sendEmailCode(userId: string, email: string): Promise<boolean> {
    if (!this.config.methods.includes('email')) {
      throw new Error('Email method is not enabled');
    }

    try {
      const code = this.generateVerificationCode(6);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10分钟有效期

      await this.storeVerificationCode(userId, 'email', code, expiresAt);

      // TODO: 集成邮件服务发送验证码
      // await emailService.send(email, '验证码', `您的验证码是: ${code}，10分钟内有效。`);

      logger.info('Email verification code sent', { userId, email });

      return true;
    } catch (error) {
      logger.error('Failed to send email code', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async verifyCode(
    userId: string,
    method: 'sms' | 'email',
    code: string
  ): Promise<boolean> {
    try {
      const storedData = await this.getStoredCode(userId, method);
      
      if (!storedData) {
        throw new Error(`No ${method} code found for user`);
      }

      if (Date.now() > storedData.expiresAt) {
        await this.deleteStoredCode(userId, method);
        throw new Error(`${method.toUpperCase()} code has expired`);
      }

      if (storedData.code !== code) {
        await this.recordMFAFailure(userId, method);
        return false;
      }

      await this.deleteStoredCode(userId, method);
      await this.recordMFASuccess(userId, method);

      logger.info(`${method.toUpperCase()} verification successful`, { userId });

      return true;
    } catch (error) {
      logger.error(`${method.toUpperCase()} verification failed`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    try {
      const recoveryCodes = await this.getStoredRecoveryCodes(userId);
      
      if (!recoveryCodes || !recoveryCodes.includes(code)) {
        await this.recordMFAFailure(userId, 'recovery_code');
        return false;
      }

      await this.useRecoveryCode(userId, code);
      await this.recordMFASuccess(userId, 'recovery_code');

      logger.info('Recovery code verified successfully', { userId });

      return true;
    } catch (error) {
      logger.error('Recovery code verification failed', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async checkMFARequired(userId: string): Promise<{ required: boolean; methods: string[] }> {
    const mfaEnabled = await this.isMFAEnabledForUser(userId);
    
    if (!mfaEnabled || !this.config.enabled) {
      return { required: false, methods: [] };
    }

    return {
      required: true,
      methods: this.config.methods,
    };
  }

  async disableMFAForUser(userId: string, currentPassword: string): Promise<boolean> {
    try {
      const passwordValid = await this.verifyPassword(userId, currentPassword);
      
      if (!passwordValid) {
        throw new Error('Invalid password');
      }

      await this.clearMFAData(userId);

      logger.info('MFA disabled for user', { userId });

      return true;
    } catch (error) {
      logger.error('Failed to disable MFA', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    
    for (let i = 0; i < (this.config.totpSecretLength || 32); i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return secret;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < (this.config.recoveryCodesCount || 10); i++) {
      codes.push(this.generateVerificationCode(8).toUpperCase());
    }

    return codes;
  }

  private generateVerificationCode(length: number): string {
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }

    return code;
  }

  private async validateTOTPToken(secret: string, token: string): Promise<boolean> {
    // 简化实现 - 实际应使用otplib等库进行真正的TOTP验证
    // 这里仅作示例
    
    // TODO: 使用 otplib 或类似库实现真正的 TOTP 验证
    // import { authenticator } from 'otplib';
    // return authenticator.verify({ token, secret });
    
    return token.length === 6 && /^\d+$/.test(token);
  }

  private async getUserEmail(userId: string): Promise<string> {
    // TODO: 从数据库获取用户邮箱
    return `${userId}@example.com`;
  }

  private async getStoredSecret(userId: string): Promise<string | null> {
    // TODO: 从数据库/Redis获取存储的TOTP密钥
    return null;
  }

  private async storeVerificationCode(
    userId: string,
    method: string,
    code: string,
    expiresAt: number
  ): Promise<void> {
    // TODO: 存储验证码到Redis或数据库
  }

  private async getStoredCode(userId: string, method: string): Promise<{
    code: string;
    expiresAt: number;
  } | null> {
    // TODO: 获取存储的验证码
    return null;
  }

  private async deleteStoredCode(userId: string, method: string): Promise<void> {
    // TODO: 删除已使用的验证码
  }

  private async getStoredRecoveryCodes(userId: string): Promise<string[] | null> {
    // TODO: 获取恢复代码列表
    return null;
  }

  private async useRecoveryCode(userId: string, code: string): Promise<void> {
    // TODO: 标记恢复代码为已使用
  }

  private async recordMFASuccess(userId: string, method: string): Promise<void> {
    // TODO: 记录MFA成功事件
  }

  private async recordMFAFailure(userId: string, method: string): Promise<void> {
    // TODO: 记录MFA失败事件（用于检测暴力攻击）
  }

  private async isMFAEnabledForUser(userId: string): Promise<boolean> {
    // TODO: 检查用户是否启用了MFA
    return false;
  }

  private async clearMFAData(userId: string): Promise<void> {
    // TODO: 清除用户的所有MFA数据
  }

  private async verifyPassword(userId: string, password: string): Promise<boolean> {
    // TODO: 验证用户密码
    return false;
  }
}

export const mfaManager = new MFAManager();
export { MFAManager };
