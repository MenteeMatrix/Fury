import CircuitBreaker from 'opossum';
import { request } from 'undici';

interface UpstreamCallOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

const defaultBreakerOptions: CircuitBreaker.Options = {
  timeout: 10000, // 10s
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // 30s
};

export function createServiceBreaker(serviceName: string, customOptions?: Partial<CircuitBreaker.Options>) {
  const options = { ...defaultBreakerOptions, ...customOptions };

  const breaker = new CircuitBreaker(async (callOptions: UpstreamCallOptions) => {
    const { url, method = 'GET', headers = {}, body } = callOptions;
    const response = await request(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body,
    });

    const responseBody = await response.body.text();
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseBody);
    } catch {
      parsedData = responseBody;
    }

    if (response.statusCode >= 500) {
      const error: any = new Error(`${serviceName} upstream server error (${response.statusCode})`);
      error.statusCode = response.statusCode;
      error.data = parsedData;
      throw error;
    }

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      data: parsedData,
    };
  }, options);

  breaker.on('open', () => console.warn(`[CircuitBreaker] ${serviceName} circuit OPENED!`));
  breaker.on('halfOpen', () => console.info(`[CircuitBreaker] ${serviceName} circuit HALF-OPEN, testing...`));
  breaker.on('close', () => console.info(`[CircuitBreaker] ${serviceName} circuit CLOSED and healthy.`));

  return breaker;
}
