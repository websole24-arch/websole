import { useState } from 'react';
import client from '../../api/client';
import { describeApiError } from '../../utils/apiError';

// ServicesTab, PackagesTab, FreeToolsTab, PortfolioTab, and PricingTab
// each independently wired up the same "create it, PUT/PATCH it, delete
// it with a window.confirm and roll back to a friendly error on
// failure" glue around their own resource. Only the endpoint, which
// HTTP verb the route uses for update (see each resource's routes
// file — PUT vs PATCH), the confirm-dialog wording, and the delete
// error message actually differed — this hook is the one shared copy.
//
// List-loading stays owned by each tab (some load one resource, some
// load two or three in parallel — e.g. PackagesTab also needs the
// services list for its form), so this hook takes the tab's own
// `reload` function rather than trying to own list state itself. It
// does own `error`, so pass this hook's `setError` into that `load`
// function too, so load failures and create/update/delete failures
// land in the same banner the tab already renders.
export default function useAdminCrud({
  basePath,
  updateMethod = 'put', // 'put' or 'patch' — must match the resource's route
  confirmMessage, // (row) => string shown in the delete confirmation dialog
  deleteErrorMessage = 'Could not delete this item.',
  reload,
}) {
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const create = async (payload) => {
    await client.post(basePath, payload);
    setCreating(false);
    await reload();
  };

  const update = async (id, payload) => {
    await client[updateMethod](`${basePath}/${id}`, payload);
    setEditingId(null);
    await reload();
  };

  const remove = async (row) => {
    if (!window.confirm(confirmMessage(row))) return;
    try {
      await client.delete(`${basePath}/${row.id}`);
      await reload();
    } catch (err) {
      setError(describeApiError(err, deleteErrorMessage));
    }
  };

  return {
    error, setError,
    creating, setCreating,
    editingId, setEditingId,
    create, update, remove,
  };
}
