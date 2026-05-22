import jwt, { type SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email?: string;
  role?: string;
  type?: string;
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
  return jwt.verify(token, secret) as TokenPayload;
}

export async function signToken(
  payload: TokenPayload,
  expiresIn: string = '24h'
): Promise<string> {
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
}
