// Tests the *controller logic* around Supabase Storage (ownership,
// category validation, signed-url generation, download-count tracking) —
// not Storage itself. No network access to *.supabase.co in this
// environment, so the SDK is mocked, same approach as
// authController.test.js/paymentController.test.js take for their SDKs.
jest.mock('../../src/lib/supabase');
jest.mock('../../src/models/ProjectFile');
jest.mock('../../src/models/Project');
jest.mock('../../src/models/ActivityLog');
jest.mock('../../src/models/User');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getSupabaseAdmin } = require('../../src/lib/supabase');
const ProjectFile = require('../../src/models/ProjectFile');
const Project = require('../../src/models/Project');
const User = require('../../src/models/User');
const app = require('../../src/app');

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const cookieFor = (userId) => {
  const token = jwt.sign({ sub: userId, role: 'authenticated' }, SUPABASE_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
  return `sb_access_token=${token}`;
};

const owner = { id: 'cust-1', role: 'customer', email: 'owner@example.com', isActive: true };
const stranger = { id: 'cust-2', role: 'customer', email: 'stranger@example.com', isActive: true };
const admin = { id: 'admin-1', role: 'admin', email: 'admin@example.com', isActive: true };

const project = { id: 'proj-1', customer: { id: 'cust-1' } };

// ProjectFile.CATEGORIES is read directly (not called as a fn) by the
// controller's validation — restore the real list on the mock.
ProjectFile.CATEGORIES = ['Brief', 'Payment Slip', 'Design', 'Development', 'Preview', 'Documents', 'Final Delivery'];

const mockStorageClient = () => {
  const bucket = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.example/file' }, error: null }),
    remove: jest.fn().mockResolvedValue({ error: null }),
  };
  return { storage: { from: jest.fn(() => bucket) }, __bucket: bucket };
};

describe('fileController (mocked Supabase Storage)', () => {
  let supabase;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = mockStorageClient();
    getSupabaseAdmin.mockReturnValue(supabase);
    User.findById.mockImplementation(async (id) => [owner, stranger, admin].find((u) => u.id === id) || null);
    ProjectFile.CATEGORIES = ['Brief', 'Payment Slip', 'Design', 'Development', 'Preview', 'Documents', 'Final Delivery'];
  });

  describe('POST /api/projects/:id/files', () => {
    it('uploads to Storage and creates a metadata row for the project owner', async () => {
      Project.findById.mockResolvedValue(project);
      ProjectFile.create.mockResolvedValue({ id: 'file-1', category: 'Brief', originalName: 'brief.pdf' });

      const res = await request(app)
        .post('/api/projects/proj-1/files')
        .set('Cookie', cookieFor(owner.id))
        .field('category', 'Brief')
        .attach('file', Buffer.from('%PDF-1.4 test'), { filename: 'brief.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(201);
      expect(supabase.__bucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^proj-1\//),
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'application/pdf' })
      );
      expect(ProjectFile.create).toHaveBeenCalledWith(
        expect.objectContaining({ project: 'proj-1', uploadedBy: owner.id, category: 'Brief' })
      );
    });

    it('accepts "Payment Slip" as a category (manual/WhatsApp payment proof)', async () => {
      Project.findById.mockResolvedValue(project);
      ProjectFile.create.mockResolvedValue({ id: 'file-2', category: 'Payment Slip', originalName: 'slip.jpg' });

      const res = await request(app)
        .post('/api/projects/proj-1/files')
        .set('Cookie', cookieFor(owner.id))
        .field('category', 'Payment Slip')
        .attach('file', Buffer.from('fake-jpeg-bytes'), { filename: 'slip.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(ProjectFile.create).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Payment Slip' })
      );
    });

    it('blocks a customer who does not own the project', async () => {
      Project.findById.mockResolvedValue(project);

      const res = await request(app)
        .post('/api/projects/proj-1/files')
        .set('Cookie', cookieFor(stranger.id))
        .field('category', 'Brief')
        .attach('file', Buffer.from('data'), { filename: 'brief.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(403);
      expect(supabase.__bucket.upload).not.toHaveBeenCalled();
    });

    it('rejects a disallowed file type before it reaches Storage', async () => {
      Project.findById.mockResolvedValue(project);

      const res = await request(app)
        .post('/api/projects/proj-1/files')
        .set('Cookie', cookieFor(owner.id))
        .field('category', 'Brief')
        .attach('file', Buffer.from('#!/bin/sh'), { filename: 'script.sh', contentType: 'application/x-sh' });

      expect(res.status).toBe(400);
      expect(supabase.__bucket.upload).not.toHaveBeenCalled();
    });

    it('rejects an invalid category', async () => {
      Project.findById.mockResolvedValue(project);

      const res = await request(app)
        .post('/api/projects/proj-1/files')
        .set('Cookie', cookieFor(owner.id))
        .field('category', 'NotARealCategory')
        .attach('file', Buffer.from('%PDF-1.4'), { filename: 'brief.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(supabase.__bucket.upload).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/projects/:id/files/:fileId/download', () => {
    it('returns a signed URL and increments the download count', async () => {
      Project.findById.mockResolvedValue(project);
      ProjectFile.findById.mockResolvedValue({ id: 'file-1', project: 'proj-1', storedName: 'proj-1/x-brief.pdf', originalName: 'brief.pdf' });

      const res = await request(app)
        .get('/api/projects/proj-1/files/file-1/download')
        .set('Cookie', cookieFor(owner.id));

      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://signed.example/file');
      expect(supabase.__bucket.createSignedUrl).toHaveBeenCalledWith('proj-1/x-brief.pdf', 60);
      expect(ProjectFile.incrementDownloadCount).toHaveBeenCalledWith('file-1');
    });

    it('404s a file id that does not belong to the project in the URL', async () => {
      Project.findById.mockResolvedValue(project);
      ProjectFile.findById.mockResolvedValue({ id: 'file-1', project: 'some-other-project', storedName: 'x' });

      const res = await request(app)
        .get('/api/projects/proj-1/files/file-1/download')
        .set('Cookie', cookieFor(owner.id));

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id/files/:fileId', () => {
    it('lets an admin delete a file', async () => {
      Project.findById.mockResolvedValue(project);
      ProjectFile.findById.mockResolvedValue({ id: 'file-1', project: 'proj-1', storedName: 'proj-1/x-brief.pdf', category: 'Brief', originalName: 'brief.pdf' });

      const res = await request(app)
        .delete('/api/projects/proj-1/files/file-1')
        .set('Cookie', cookieFor(admin.id));

      expect(res.status).toBe(200);
      expect(supabase.__bucket.remove).toHaveBeenCalledWith(['proj-1/x-brief.pdf']);
      expect(ProjectFile.remove).toHaveBeenCalledWith('file-1');
    });

    it('blocks a non-admin (including the project owner) from deleting', async () => {
      Project.findById.mockResolvedValue(project);

      const res = await request(app)
        .delete('/api/projects/proj-1/files/file-1')
        .set('Cookie', cookieFor(owner.id));

      expect(res.status).toBe(403);
      expect(supabase.__bucket.remove).not.toHaveBeenCalled();
    });
  });
});
