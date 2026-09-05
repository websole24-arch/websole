const crypto = require('crypto');
const multer = require('multer');
const PortfolioProject = require('../models/PortfolioProject');
const buildCrudController = require('../utils/crudController');
const { getSupabaseAdmin } = require('../lib/supabase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const {
  list: listPublished,
  listAdmin: listAllAdmin,
  create: createProject,
  update: updateProject,
  remove: deleteProject,
} = buildCrudController(PortfolioProject, {
  entityLabel: 'Project',
  singularKey: 'project',
  pluralKey: 'projects',
  listMethod: 'listPublished',
  allowedFields: [
    'title', 'description', 'service', 'country', 'imageUrl', 'projectUrl',
    'completedOn', 'published', 'techStack', 'features',
  ],
});

// Separate from the private "project-files" bucket used by
// fileController.js — portfolio images are shown directly on the public
// site (Home/Portfolio), so this bucket must be created as Public in the
// Supabase dashboard (Storage -> New bucket), not Private + signed URLs.
const IMAGE_BUCKET = process.env.SUPABASE_PORTFOLIO_BUCKET || 'Project';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, `Image type ${file.mimetype} is not allowed`));
    }
    cb(null, true);
  },
});

// multer's own errors don't carry .isOperational, so the global
// errorHandler would show them as a generic 500 — wrap so they're clean 400s.
const uploadImageMiddleware = (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(new ApiError(400, err.code === 'LIMIT_FILE_SIZE'
        ? `Image exceeds the ${MAX_IMAGE_SIZE / (1024 * 1024)}MB limit`
        : err.message));
    }
    next(err);
  });
};

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image provided (field name must be "image")');

  const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const storedName = `${crypto.randomUUID()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storedName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new ApiError(502, `Could not store the image: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storedName);

  res.status(201).json({ success: true, imageUrl: data.publicUrl });
});

module.exports = {
  listPublished, listAllAdmin, createProject, updateProject, deleteProject,
  uploadImageMiddleware, uploadImage,
};
