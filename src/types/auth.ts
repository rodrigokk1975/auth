export interface TokenPayload {
  sub: number;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}
