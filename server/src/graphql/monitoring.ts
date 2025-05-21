import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { performance } from 'perf_hooks';
import { promisify } from 'util';
import { redisClient } from '../lib/redis';

interface OperationMetrics {
  operationName: string;
  operationType: string;
  duration: number;
  timestamp: number;
  success: boolean;
  cacheHit?: boolean;
  tenantId?: string;
  userId?: string;
  errorMessage?: string;
  path?: string[];
}

// Store metrics in Redis hash
async function storeMetrics(metrics: OperationMetrics) {
  const metricsKey = `metrics:${metrics.operationName}:${Date.now()}`;
  await redisClient.hset(metricsKey, metrics);
  await redisClient.expire(metricsKey, 86400); // 24 hours
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
            operationType: operation?.operation || 'unknown',
            duration,
            timestamp: Date.now(),
            success: !response.errors,
            cacheHit: response.http?.headers.get('apollo-cache-hit') === 'true',
          };

          await storeMetrics(metrics);

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
