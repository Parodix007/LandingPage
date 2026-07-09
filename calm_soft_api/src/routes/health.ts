import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance, opts: { readiness: () => Promise<{ ok: boolean }> }) {
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/ready', async (_req, reply) => {
    const r = await opts.readiness();
    return reply.code(r.ok ? 200 : 503).send({ status: r.ok ? 'ready' : 'unready' });
  });
}
