import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'crypto';
import { config } from './config/env';
import { healthRoutes } from './routes/health.routes';
import { authGatewayRoutes } from './routes/auth.routes';
import { assessmentGatewayRoutes } from './routes/assessment.routes';
import { dashboardBffRoutes } from './routes/dashboard.routes';

async function bootstrap() {
  const server = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
    disableRequestLogging: false,
  });

  // Security Headers
  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  // CORS
  await server.register(cors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Rate Limiter
  await server.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW,
    errorResponseBuilder: (req, context) => ({
      type: 'https://assessverse.io/errors/too-many-requests',
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit exceeded. Try again in ${Math.ceil(context.after / 1000)} seconds.`,
      instance: req.url,
    }),
  });

  // Register Microservice Gateway Routes
  await server.register(healthRoutes);
  await server.register(authGatewayRoutes);
  await server.register(assessmentGatewayRoutes);
  await server.register(dashboardBffRoutes);

  // Global Error Handler (RFC 7807)
  server.setErrorHandler((error, request, reply) => {
    server.log.error({ err: error, reqId: request.id }, 'Unhandled Error');
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      type: 'https://assessverse.io/errors/internal-error',
      title: error.name || 'Internal Server Error',
      status: statusCode,
      detail: config.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      instance: request.url,
      requestId: request.id,
    });
  });

  // Graceful Shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}. Draining connections...`);
      await server.close();
      server.log.info('Fury Gateway server gracefully stopped.');
      process.exit(0);
    });
  }

  try {
    await server.listen({ port: config.PORT, host: config.HOST });
    server.log.info(`⭐ FURY API Gateway listening on http://${config.HOST}:${config.PORT}`);
  } catch (err) {
    server.log.fatal(err, 'Failed to start Fury gateway server');
    process.exit(1);
  }
}

bootstrap();
