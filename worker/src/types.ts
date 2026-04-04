import type { IRequest } from 'itty-router';

export type Env = {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
};

export type AuthedRequest = IRequest & { userId: string };
