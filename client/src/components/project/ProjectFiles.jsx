import { useEffect, useState } from 'react';
import client from '../../api/client';
import { describeApiError } from '../../utils/apiError';

const ALL_CATEGORIES = ['Brief', 'Payment Slip', 'Design', 'Development', 'Preview', 'Documents', 'Final Delivery'];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Reused by both the customer Dashboard (uploadCategories=['Brief'],
// canDelete=false) and the admin ProjectsTab (full category list,
// canDelete=true) — see server/src/controllers/fileController.js for the
// matching auth rules this UI reflects (owner-or-admin to upload/view,
// admin-only to delete).
export default function ProjectFiles({ projectId, uploadCategories = ALL_CATEGORIES, canDelete = false }) {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(uploadCategories[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setError('');
    return client
      .get(`/projects/${projectId}/files`)
      .then(({ data }) => setFiles(data.files || []))
      .catch((err) => setError(describeApiError(err, 'Could not load files.')));
  };

  useEffect(() => { load(); }, [projectId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('category', category);
      await client.post(`/projects/${projectId}/files`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFile(null);
      e.target.reset();
      await load();
    } catch (err) {
      setUploadError(describeApiError(err, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    setBusyId(file.id);
    try {
      const { data } = await client.get(`/projects/${projectId}/files/${file.id}/download`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(describeApiError(err, 'Could not generate a download link.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (file) => {
    setBusyId(file.id);
    try {
      await client.delete(`/projects/${projectId}/files/${file.id}`);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      setError(describeApiError(err, 'Could not delete the file.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4 sm:p-5">
      <p className="font-display text-sm font-bold text-ink">Files</p>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {files === null && !error && (
        <div className="mt-3 space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-ink/[0.04]" />)}
        </div>
      )}

      {files?.length === 0 && (
        <p className="mt-2 text-xs text-muted-light">No files yet.</p>
      )}

      {files?.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{f.originalName}</p>
                <p className="text-[11px] text-muted-light">{f.category} · {formatSize(f.size)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={busyId === f.id}
                  onClick={() => handleDownload(f)}
                  className="rounded-md bg-signal-soft px-2.5 py-1 font-semibold text-signal hover:bg-signal hover:text-white transition-colors disabled:opacity-50"
                >
                  Download
                </button>
                {canDelete && (
                  <button
                    type="button"
                    disabled={busyId === f.id}
                    onClick={() => handleDelete(f)}
                    className="rounded-md border border-red-200 px-2.5 py-1 font-semibold text-red-700 hover:border-red-400 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
        {uploadCategories.length > 1 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-ink/15 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs focus:border-signal focus:outline-none"
          >
            {uploadCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="min-w-0 flex-1 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-ink/5 file:px-2.5 file:py-1.5 file:text-xs file:font-medium"
        />
        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="rounded-lg bg-signal px-3 py-1.5 text-xs font-semibold text-white hover:bg-signal-deep transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
      <p className="mt-1.5 text-[10px] text-muted-light">PDF, images, Office docs, ZIP — up to 25MB.</p>
    </div>
  );
}
