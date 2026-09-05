const Review = require('../models/Review');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Public — approved reviews only.
const listPublicReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.listApproved();
  res.json({ success: true, reviews });
});

// Authenticated customer — one review per account, and only once they
// actually have a Completed project. The dashboard already only shows
// the review form in that case (see Dashboard.jsx), but that's a UI
// nicety, not enforcement — this is the real gate, since the endpoint
// is reachable directly regardless of what the client shows. name/
// country are taken from the logged-in user's own profile rather than
// the request body, so a review always reflects who actually submitted
// it.
const createReview = asyncHandler(async (req, res) => {
  const existing = await Review.findByUser(req.user.id);
  if (existing) {
    throw new ApiError(400, 'You have already submitted a review');
  }

  const eligible = await Project.hasCompletedProject(req.user.id);
  if (!eligible) {
    throw new ApiError(403, 'Reviews can only be left once a project has been completed');
  }

  const { rating, comment, service } = req.body;
  const review = await Review.create({
    userId: req.user.id,
    name: req.user.name,
    country: req.user.country,
    service,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    review,
    message: 'Thanks for the review — it will appear once approved.',
  });
});

// Authenticated customer — check whether they've already submitted one,
// and see its current approval state.
const getMyReview = asyncHandler(async (req, res) => {
  const review = await Review.findByUser(req.user.id);
  res.json({ success: true, review });
});

// Admin-only — pending and approved reviews together.
const listAllAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.listAllAdmin();
  res.json({ success: true, reviews });
});

const setApproval = asyncHandler(async (req, res) => {
  const review = await Review.setApproved(req.params.id, req.body.approved);
  if (!review) throw new ApiError(404, 'Review not found');
  res.json({ success: true, review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const removed = await Review.remove(req.params.id);
  if (!removed) throw new ApiError(404, 'Review not found');
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = {
  listPublicReviews, createReview, getMyReview, listAllAdmin, setApproval, deleteReview,
};
