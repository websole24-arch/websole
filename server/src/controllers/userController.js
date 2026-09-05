const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Admin-only. Powers the Customers tab in the admin dashboard. Read-only
// profile data — no passwords/tokens live in this table (Supabase Auth
// owns credentials, see DECISIONS.md).
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.listAll();
  res.json({ success: true, users });
});

// Admin-only. Deliberately narrow: only isActive and role are editable
// here. isActive is enforced by the `protect` middleware on every
// subsequent request from that account (see middleware/auth.js), so this
// is a real, functioning "disable account" control, not a cosmetic flag.
const updateUser = asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;

  if (isActive === undefined && role === undefined) {
    throw new ApiError(400, 'Provide isActive and/or role to update');
  }
  if (role !== undefined && !['customer', 'admin'].includes(role)) {
    throw new ApiError(400, 'role must be "customer" or "admin"');
  }
  if (req.params.id === req.user.id && (isActive === false || role === 'customer')) {
    throw new ApiError(400, "You can't disable or demote your own account");
  }

  const user = await User.update(req.params.id, { isActive, role });
  if (!user) throw new ApiError(404, 'User not found');

  res.json({ success: true, user });
});

module.exports = { listUsers, updateUser };
