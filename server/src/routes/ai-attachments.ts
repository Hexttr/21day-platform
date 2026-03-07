import { FastifyInstance } from 'fastify';
import { getAuthFromRequest } from '../lib/auth.js';
import { aiAttachmentConfig, createDocumentAttachment, listUserAiAttachments } from '../lib/ai/attachments.js';

export async function aiAttachmentsRoutes(app: FastifyInstance) {
  app.get('/ai/attachments', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload) {
      return reply.status(401).send({ error: 'Требуется авторизация' });
    }

    const attachments = await listUserAiAttachments(payload.userId);
    return reply.send({
      attachments,
      limits: {
        maxDocumentsPerMessage: aiAttachmentConfig.maxDocumentsPerMessage,
        maxFileSizeBytes: aiAttachmentConfig.maxFileSizeBytes,
      },
    });
  });

  app.post('/ai/attachments', async (req, reply) => {
    const payload = getAuthFromRequest(req);
    if (!payload) {
      return reply.status(401).send({ error: 'Требуется авторизация' });
    }

    let buffer: Buffer | null = null;
    let originalName = '';
    let mimeType = '';

    for await (const part of req.parts()) {
      if (part.type === 'file' && part.fieldname === 'file') {
        originalName = part.filename || '';
        mimeType = part.mimetype || '';
        buffer = await part.toBuffer();
      }
    }

    if (!buffer || !originalName) {
      return reply.status(400).send({ error: 'Файл обязателен' });
    }

    try {
      const attachment = await createDocumentAttachment({
        userId: payload.userId,
        originalName,
        mimeType,
        fileSize: buffer.byteLength,
        buffer,
      });
      return reply.send({ attachment });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Не удалось обработать документ',
      });
    }
  });
}
