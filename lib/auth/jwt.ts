import jwt, { type SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email?: string;
  role?: string;
  type?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'fallback-secret-for-dev';
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as TokenPayload;
}

export async function signToken(
  payload: TokenPayload,
  expiresIn: string = '24h'
): Promise<string> {
  const secret = getJwtSecret();
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
}
