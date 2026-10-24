import { FastifyInstance } from 'fastify';
import { rogersBreaker, starkBreaker } from '../upstream/clients';

export async function healthRoutes(server: FastifyInstance) {
  server.get('/health/liveness', async () => {
    return {
      status: 'UP',
      service: 'fury-gateway',
      timestamp: new Date().toISOString(),
    };
  });

  server.get('/health/readiness', async () => {
    return {
      status: 'UP',
      service: 'fury-gateway',
      circuitBreakers: {
        rogers: rogersBreaker.opened ? 'OPEN' : 'CLOSED',
        stark: starkBreaker.opened ? 'OPEN' : 'CLOSED',
      },
      timestamp: new Date().toISOString(),
    };
  });
}
