import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserPayload } from '../types';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      type: 'https://assessverse.io/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing or malformed Authorization header. Expected Bearer token.',
      instance: request.url,
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;
    request.user = decoded;
  } catch (err: any) {
    return reply.status(401).send({
      type: 'https://assessverse.io/errors/invalid-token',
      title: 'Invalid Token',
      status: 401,
      detail: err.message || 'Token is invalid or has expired',
      instance: request.url,
    });
  }
}

export function requireRole(allowedRoles: Array<UserPayload['role']>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        type: 'https://assessverse.io/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        detail: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        instance: request.url,
      });
    }
  };
}
