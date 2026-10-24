import { config } from '../config/env';
import { createServiceBreaker } from './circuit-breaker';

export const rogersBreaker = createServiceBreaker('Rogers-Auth', { timeout: 5000 });
export const starkBreaker = createServiceBreaker('Stark-Assessment', { timeout: 8000 });
export const jarvisBreaker = createServiceBreaker('Jarvis-AI', { timeout: 60000 });

export const upstreamClients = {
  // Call Rogers (Auth & Identity)
  callRogers: async (path: string, options: { method?: any; headers?: any; body?: any }) => {
    const url = `${config.ROGERS_URL}${path}`;
    return rogersBreaker.fire({
      url,
      method: options.method || 'GET',
      headers: {
        'x-internal-secret': config.INTERNAL_SERVICE_SECRET,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  },

  // Call Stark (Assessment & Question Bank)
  callStark: async (path: string, options: { method?: any; headers?: any; body?: any }) => {
    const url = `${config.STARK_URL}${path}`;
    return starkBreaker.fire({
      url,
      method: options.method || 'GET',
      headers: {
        'x-internal-secret': config.INTERNAL_SERVICE_SECRET,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  },
};
