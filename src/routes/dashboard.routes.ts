import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { upstreamClients } from '../upstream/clients';
import { authenticate } from '../middlewares/auth.middleware';

export async function dashboardBffRoutes(server: FastifyInstance) {
  // Professor / Student Aggregated Dashboard
  server.get(
    '/api/v1/dashboard',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const headers = {
        'x-user-id': request.user?.id || '',
        'x-user-role': request.user?.role || '',
        'x-tenant-id': request.user?.tenantId || '',
      };

      try {
        // Parallel fan-out to Rogers and Stark
        const [userProfileRes, assessmentsRes] = await Promise.allSettled([
          upstreamClients.callRogers('/auth/me', { headers }),
          upstreamClients.callStark('/assessments', { headers }),
        ]);

        const profile = userProfileRes.status === 'fulfilled' ? userProfileRes.value.data : null;
        const assessments = assessmentsRes.status === 'fulfilled' ? assessmentsRes.value.data : [];

        return reply.status(200).send({
          success: true,
          aggregatedAt: new Date().toISOString(),
          data: {
            user: profile?.user || { id: request.user?.id, role: request.user?.role },
            assessments: assessments || [],
            stats: {
              totalAssessments: Array.isArray(assessments) ? assessments.length : 0,
              activeExams: Array.isArray(assessments) ? assessments.filter((a: any) => a.status === 'PUBLISHED').length : 0,
              drafts: Array.isArray(assessments) ? assessments.filter((a: any) => a.status === 'DRAFT').length : 0,
            },
          },
        });
      } catch (err: any) {
        server.log.error({ err }, 'Error in dashboard aggregation');
        return reply.status(500).send({
          error: 'Failed to aggregate dashboard metrics',
        });
      }
    }
  );
}
