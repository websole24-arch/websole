// Shared by fileController, paymentController, and projectController,
// which each independently defined an identical `isOwner` — the project
// belongs to req.user if they're the customer on it, or any admin.
// `project.customer` is an object (`{ id, name, email }`) when the row
// came from a populated query, but a plain UUID string when it came from
// a PLAIN_COLUMNS query — handle both so the check doesn't silently
// always fail for non-admins on the plain-column code paths.
const isProjectOwner = (project, user) => {
  const customerId = typeof project.customer === 'object' && project.customer !== null
    ? project.customer.id
    : project.customer;
  return user.role === 'admin' || customerId === user.id;
};

module.exports = isProjectOwner;
