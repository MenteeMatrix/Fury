import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { upstreamClients } from '../upstream/clients';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

export async function assessmentGatewayRoutes(server: FastifyInstance) {
  // List assessments (Authenticated)
  server.get(
    '/api/v1/assessments',
    { preHandler: [authenticate] },
    async (request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) => {
      try {
        const queryParams = new URLSearchParams(request.query || {}).toString();
        const path = `/assessments${queryParams ? `?${queryParams}` : ''}`;

        const response: any = await upstreamClients.callStark(path, {
          headers: {
            'x-user-id': request.user?.id,
            'x-user-role': request.user?.role,
            'x-tenant-id': request.user?.tenantId,
          },
        });
        return reply.status(response.statusCode).send(response.data);
      } catch (err: any) {
        server.log.error({ err }, 'Error calling Stark for assessments');
        return reply.status(err.statusCode || 502).send(err.data || { error: 'Assessment service temporarily unavailable' });
      }
    }
  );

  // Create new assessment (Professor or Admin only)
  server.post(
    '/api/v1/assessments',
    { preHandler: [requireRole(['professor', 'admin', 'superadmin'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const response: any = await upstreamClients.callStark('/assessments', {
          method: 'POST',
          headers: {
            'x-user-id': request.user?.id,
            'x-user-role': request.user?.role,
            'x-tenant-id': request.user?.tenantId,
          },
          body: request.body,
        });
        return reply.status(response.statusCode).send(response.data);
      } catch (err: any) {
        return reply.status(err.statusCode || 502).send(err.data || { error: 'Failed to create assessment' });
      }
    }
  );

  // Get assessment details
  server.get(
    '/api/v1/assessments/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const response: any = await upstreamClients.callStark(`/assessments/${request.params.id}`, {
          headers: {
            'x-user-id': request.user?.id,
            'x-user-role': request.user?.role,
            'x-tenant-id': request.user?.tenantId,
          },
        });
        return reply.status(response.statusCode).send(response.data);
      } catch (err: any) {
        return reply.status(err.statusCode || 502).send(err.data || { error: 'Assessment not found or service unavailable' });
      }
    }
  );

  // Trigger AI Question Generation via Stark -> Jarvis
  server.post(
    '/api/v1/assessments/:id/generate-questions',
    { preHandler: [requireRole(['professor', 'admin', 'superadmin'])] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const response: any = await upstreamClients.callStark(`/assessments/${request.params.id}/generate-questions`, {
          method: 'POST',
          headers: {
            'x-user-id': request.user?.id,
            'x-user-role': request.user?.role,
            'x-tenant-id': request.user?.tenantId,
          },
          body: request.body,
        });
        return reply.status(response.statusCode).send(response.data);
      } catch (err: any) {
        return reply.status(err.statusCode || 502).send(err.data || { error: 'Failed to initiate AI question generation' });
      }
    }
  );
}
