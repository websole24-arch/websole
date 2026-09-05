const crypto = require('crypto');
const multer = require('multer');
const { getSupabaseAdmin } = require('../lib/supabase');
const ProjectFile = require('../models/ProjectFile');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const isOwner = require('../utils/isProjectOwner');

// Bucket must be created once in the Supabase dashboard (Storage -> New
// bucket) — this app never creates it programmatically. Keep it Private;
// downloads are served through signed URLs (see downloadFile below), not
// public bucket URLs, so ownership stays enforced.
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'project-files';

// Declared-MIME allowlist + size cap, backed by a magic-byte sniff in
// uploadFile below (see the `fileTypeFromBuffer` call) so a renamed file
// with a spoofed Content-Type doesn't sail through on the declared type
// alone. Formats file-type can't fingerprint (plain text, CSV, JSON)
// still rely on the declared Content-Type here — that's an accepted
// residual gap, not a bypass of the sniff check.
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'text/csv',
  'application/json',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, `File type ${file.mimetype} is not allowed`));
    }
    cb(null, true);
  },
});

// multer's own errors (file too large, unexpected field name, etc.)
// don't carry .isOperational, so the global errorHandler would show them
// as a generic 500 — wrap the multer call so those become clean 400s.
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(new ApiError(400, err.code === 'LIMIT_FILE_SIZE'
        ? `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
        : err.message));
    }
    next(err); // already an ApiError from fileFilter, or something unexpected
  });
};

const loadProjectOrThrow = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!isOwner(project, user)) throw new ApiError(403, 'Not authorized for this project');
  return project;
};

const uploadFile = asyncHandler(async (req, res) => {
  const project = await loadProjectOrThrow(req.params.id, req.user);

  if (!req.file) throw new ApiError(400, 'No file provided (field name must be "file")');

  const { category } = req.body;
  if (!ProjectFile.CATEGORIES.includes(category)) {
    throw new ApiError(400, `category must be one of: ${ProjectFile.CATEGORIES.join(', ')}`);
  }

  // Declared Content-Type (checked above, in fileFilter) is trivial to
  // spoof — a renamed .exe with `Content-Type: application/pdf` sails
  // through that check. This sniffs the actual file bytes as a second,
  // independent gate. `file-type` is ESM-only (v17+), so it's loaded via
  // dynamic import() from this CommonJS module — the standard way to
  // consume an ESM-only package from CJS. Formats it can't fingerprint
  // from magic bytes (plain text, CSV, JSON) come back `undefined`; those
  // fall through to the declared-Content-Type check above, same as
  // before.
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(req.file.buffer);
  if (detected && !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new ApiError(400, `Detected file type ${detected.mime} is not allowed`);
  }

  const storedName = `${project.id}/${crypto.randomUUID()}-${req.file.originalname}`;
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storedName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new ApiError(502, `Could not store the file: ${uploadError.message}`);
  }

  const fileRow = await ProjectFile.create({
    project: project.id,
    uploadedBy: req.user.id,
    category,
    originalName: req.file.originalname,
    storedName,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });

  await ActivityLog.create({
    project: project.id,
    actor: req.user.id,
    action: 'File uploaded',
    meta: { category, originalName: req.file.originalname },
  });

  res.status(201).json({ success: true, file: fileRow });
});

const listFiles = asyncHandler(async (req, res) => {
  const project = await loadProjectOrThrow(req.params.id, req.user);
  const files = await ProjectFile.findAllForProject(project.id);
  res.json({ success: true, files });
});

// Bucket is Private, so a signed URL (short-lived, 60s) is the only way
// to actually fetch the bytes — proxying the download through this
// server instead would work too, but streaming through Node just to
// enforce a check the signed URL already encodes isn't worth the extra
// memory/bandwidth hop.
const downloadFile = asyncHandler(async (req, res) => {
  const project = await loadProjectOrThrow(req.params.id, req.user);

  const file = await ProjectFile.findById(req.params.fileId);
  if (!file || file.project !== project.id) throw new ApiError(404, 'File not found');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(file.storedName, 60);

  if (error) throw new ApiError(502, `Could not generate download link: ${error.message}`);

  await ProjectFile.incrementDownloadCount(file.id);

  res.json({ success: true, url: data.signedUrl, originalName: file.originalName });
});

const deleteFile = asyncHandler(async (req, res) => {
  // Admin-only (see routes/fileRoutes.js) — customers can upload their
  // own briefs but shouldn't be able to delete deliverables an admin
  // posted, so this doesn't reuse loadProjectOrThrow's customer-owner
  // check; authorize('admin') on the route already covers it.
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  const file = await ProjectFile.findById(req.params.fileId);
  if (!file || file.project !== project.id) throw new ApiError(404, 'File not found');

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(BUCKET).remove([file.storedName]).catch(() => {});
  await ProjectFile.remove(file.id);

  await ActivityLog.create({
    project: project.id,
    actor: req.user.id,
    action: 'File deleted',
    meta: { category: file.category, originalName: file.originalName },
  });

  res.json({ success: true });
});

module.exports = { uploadMiddleware, uploadFile, listFiles, downloadFile, deleteFile };
