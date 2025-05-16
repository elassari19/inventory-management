import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { performance } from 'perf_hooks';
import { promisify } from 'util';
import { redisClient } from '../../lib/redis';

interface OperationMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  cacheHit?: boolean;
}

export const createPerformancePlugin = (): ApolloServerPlugin => {
  const hsetAsync = promisify(redisClient.hset).bind(redisClient);

  return {
    async requestDidStart() {
      const start = performance.now();

      return {
        async willSendResponse({ operation, response }) {
          const duration = performance.now() - start;
          const operationName = operation?.operation || 'unknown';

          const metrics: OperationMetrics = {
            operationName,
            duration,
            timestamp: Date.now(),
            success: !response.errors,
            cacheHit: response.http?.headers.get('apollo-cache-hit') === 'true',
          };

          // Store metrics in Redis with 24h expiration
          const metricsKey = `metrics:${operationName}:${Date.now()}`;
          await hsetAsync(metricsKey);
          redisClient.expire(metricsKey, 86400); // 24 hours

          // Log metrics for monitoring
          console.log(`Operation: ${operationName}`, {
            duration: `${duration.toFixed(2)}ms`,
            cacheHit: metrics.cacheHit,
            success: metrics.success,
          });
        },

        async parsingDidStart() {
          return async (err?: Error) => {
            if (err) {
              console.error('Parsing error:', err);
            }
          };
        },

        async validationDidStart() {
          return async (errs?: readonly Error[]) => {
            if (errs) {
              console.error('Validation errors:', errs);
            }
          };
        },

        async executionDidStart() {
          return {
            async executionDidEnd(err?: Error) {
              if (err) {
                console.error('Execution error:', err);
              }
            },
          };
        },
      };
    },
  };
};
