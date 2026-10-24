import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { upstreamClients } from '../upstream/clients';
import { authenticate } from '../middlewares/auth.middleware';

export async function authGatewayRoutes(server: FastifyInstance) {
  // Register new user
  server.post('/api/v1/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response: any = await upstreamClients.callRogers('/auth/register', {
        method: 'POST',
        headers: { 'x-forwarded-for': request.ip },
        body: request.body,
      });
      return reply.status(response.statusCode).send(response.data);
    } catch (err: any) {
      server.log.error({ err }, 'Error calling Rogers for registration');
      return reply.status(err.statusCode || 502).send(err.data || { error: 'Authentication service temporarily unavailable' });
    }
  });

  // Login
  server.post('/api/v1/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response: any = await upstreamClients.callRogers('/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': request.ip },
        body: request.body,
      });
      return reply.status(response.statusCode).send(response.data);
    } catch (err: any) {
      server.log.error({ err }, 'Error calling Rogers for login');
      return reply.status(err.statusCode || 502).send(err.data || { error: 'Authentication service temporarily unavailable' });
    }
  });

  // Refresh Token
  server.post('/api/v1/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response: any = await upstreamClients.callRogers('/auth/refresh', {
        method: 'POST',
        body: request.body,
      });
      return reply.status(response.statusCode).send(response.data);
    } catch (err: any) {
      return reply.status(err.statusCode || 502).send(err.data || { error: 'Token refresh failed' });
    }
  });

  // Get current user profile (Authenticated)
  server.get(
    '/api/v1/auth/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const response: any = await upstreamClients.callRogers('/auth/me', {
          headers: {
            'x-user-id': request.user?.id,
            'x-user-role': request.user?.role,
            'x-tenant-id': request.user?.tenantId,
          },
        });
        return reply.status(response.statusCode).send(response.data);
      } catch (err: any) {
        return reply.status(err.statusCode || 502).send(err.data || { error: 'Failed to fetch user profile' });
      }
    }
  );
}
