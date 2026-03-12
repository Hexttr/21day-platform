import { FastifyInstance } from 'fastify';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { testimonials } from '../db/schema.js';
import { getAuthFromRequest } from '../lib/auth.js';

export async function testimonialsRoutes(app: FastifyInstance) {
  app.get('/testimonials', async (_req, reply) => {
    const rows = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isPublished, true))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));

    return reply.send(rows);
  });

  app.get('/admin/testimonials', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return reply.status(403).send({ error: 'Требуются права администратора' });
    }

    const rows = await db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt));

    return reply.send(rows);
  });

  app.post<{
    Body: {
      name?: string;
      roleOrSubtitle?: string;
      text?: string;
      avatarVariant?: 'male' | 'female';
      sortOrder?: number;
      isPublished?: boolean;
    };
  }>('/admin/testimonials', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return reply.status(403).send({ error: 'Требуются права администратора' });
    }

    const { name, roleOrSubtitle, text, avatarVariant, sortOrder, isPublished } = req.body || {};
    if (!name?.trim() || !text?.trim()) {
      return reply.status(400).send({ error: 'Имя и текст обязательны' });
    }

    const [row] = await db.insert(testimonials).values({
      name: name.trim(),
      roleOrSubtitle: roleOrSubtitle?.trim() || '',
      text: text.trim(),
      avatarVariant: avatarVariant === 'female' ? 'female' : 'male',
      sortOrder: Number.isFinite(sortOrder) ? Number(sortOrder) : 0,
      isPublished: isPublished ?? true,
    }).returning();

    return reply.send(row);
  });

  app.put<{
    Params: { id: string };
    Body: {
      name?: string;
      roleOrSubtitle?: string;
      text?: string;
      avatarVariant?: 'male' | 'female';
      sortOrder?: number;
      isPublished?: boolean;
    };
  }>('/admin/testimonials/:id', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return reply.status(403).send({ error: 'Требуются права администратора' });
    }

    const { name, roleOrSubtitle, text, avatarVariant, sortOrder, isPublished } = req.body || {};
    if (!name?.trim() || !text?.trim()) {
      return reply.status(400).send({ error: 'Имя и текст обязательны' });
    }

    const [row] = await db.update(testimonials).set({
      name: name.trim(),
      roleOrSubtitle: roleOrSubtitle?.trim() || '',
      text: text.trim(),
      avatarVariant: avatarVariant === 'female' ? 'female' : 'male',
      sortOrder: Number.isFinite(sortOrder) ? Number(sortOrder) : 0,
      isPublished: isPublished ?? true,
      updatedAt: new Date(),
    }).where(eq(testimonials.id, req.params.id)).returning();

    if (!row) {
      return reply.status(404).send({ error: 'Отзыв не найден' });
    }

    return reply.send(row);
  });

  app.delete<{ Params: { id: string } }>('/admin/testimonials/:id', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return reply.status(403).send({ error: 'Требуются права администратора' });
    }

    const [row] = await db.delete(testimonials).where(eq(testimonials.id, req.params.id)).returning();
    if (!row) {
      return reply.status(404).send({ error: 'Отзыв не найден' });
    }

    return reply.send({ success: true });
  });
}
