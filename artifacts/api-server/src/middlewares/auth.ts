import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { findSession, type SessionKind } from "../lib/session-service";

export type AuthContext = {
  kind: SessionKind;
  accountId: string | null;
  sessionId: string;
};

function readBearerToken(request: Request): string | null {
  const header = request.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export function requireSession(kind: SessionKind) {
  return async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = readBearerToken(request);
    if (!token) {
      next(new AppError(401, "Se requiere una sesión válida"));
      return;
    }

    const session = await findSession(token, kind);
    if (!session) {
      next(new AppError(401, "La sesión no es válida o ha vencido"));
      return;
    }

    response.locals.auth = { kind, ...session } satisfies AuthContext;
    response.locals.authToken = token;
    next();
  };
}

export function getAuthContext(response: Response): AuthContext {
  return response.locals.auth as AuthContext;
}

export function getAuthToken(response: Response): string {
  return response.locals.authToken as string;
}