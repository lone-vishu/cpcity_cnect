import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Pin,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  Eye,
  Calendar,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { announcementService, auditService } from '../../services';
import { Announcement } from '../../domain/types';
import { useAuth } from '../../auth/AuthContext';
import { showToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../lib/utils';

export const AnnouncementsAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'announcement' as 'notice' | 'announcement' | 'achievement' | 'new_content',
    pinned: false,
  });

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<Announcement | null>(null);

  // Live Preview Modal
  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const list = await announcementService.getAnnouncements();
      setAnnouncements(list);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      showToast({ title: 'Error', message: 'Failed to load announcements', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      body: '',
      type: 'announcement',
      pinned: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      body: item.body,
      type: item.type,
      pinned: item.pinned,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      showToast({ title: 'Validation Error', message: 'Title and body are required', type: 'warning' });
      return;
    }

    try {
      if (editingItem) {
        await announcementService.updateAnnouncement({
          ...editingItem,
          ...formData,
        });
        showToast({ title: 'Updated', message: 'Announcement updated successfully', type: 'success' });
      } else {
        await announcementService.createAnnouncement({
          ...formData,
          publishedBy: user?.name || 'Administrator',
        });
        showToast({ title: 'Created', message: 'New announcement published across portal', type: 'success' });
      }

      await auditService.logAuditEvent({
        actorId: user?.id || 'admin',
        action: editingItem ? 'announcement_updated' : 'announcement_created',
        entityType: 'announcement',
        entityId: editingItem?.id || 'new',
        meta: { title: formData.title, type: formData.type },
      });

      setModalOpen(false);
      loadAnnouncements();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      showToast({ title: 'Error', message: 'Failed to save announcement', type: 'error' });
    }
  };

  const handleTogglePin = async (item: Announcement) => {
    try {
      await announcementService.updateAnnouncement({
        ...item,
        pinned: !item.pinned,
      });
      showToast({
        title: item.pinned ? 'Unpinned' : 'Pinned to Feed Top',
        message: `Announcement "${item.title}" ${item.pinned ? 'unpinned' : 'pinned'}`,
        type: 'info',
      });
      loadAnnouncements();
    } catch (err) {
      showToast({ title: 'Error', message: 'Failed to update pin state', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await announcementService.deleteAnnouncement(deleteConfirm.id);
      await auditService.logAuditEvent({
        actorId: user?.id || 'admin',
        action: 'announcement_deleted',
        entityType: 'announcement',
        entityId: deleteConfirm.id,
        meta: { title: deleteConfirm.title },
      });
      showToast({ title: 'Deleted', message: 'Announcement deleted', type: 'info' });
      setDeleteConfirm(null);
      loadAnnouncements();
    } catch (err) {
      showToast({ title: 'Error', message: 'Could not delete announcement', type: 'error' });
    }
  };

  const filtered = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.body.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
              Portal Communication
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {announcements.length} Total Broadcasts
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Institutional Announcements & Broadcasts
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Publish notices, technical bulletins, training achievements, and curriculum updates visible across public and dashboard views.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Announcement
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search broadcasts by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Bulletin Categories</option>
          <option value="notice">Operational Notices</option>
          <option value="announcement">Training Announcements</option>
          <option value="achievement">Cohort Achievements</option>
          <option value="new_content">Curriculum Releases</option>
        </select>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-xl border transition-all shadow-sm ${
              item.pinned
                ? 'border-saffron-300 bg-saffron-50/20 dark:bg-saffron-950/10 dark:border-saffron-800/40'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      item.type === 'notice'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        : item.type === 'achievement'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : item.type === 'new_content'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                    }`}
                  >
                    {item.type.replace('_', ' ')}
                  </span>

                  {item.pinned && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-saffron-100 text-saffron-800 dark:bg-saffron-950/50 dark:text-saffron-300">
                      <Pin className="w-3 h-3 mr-1 fill-current" /> Pinned Priority
                    </span>
                  )}

                  <span className="text-xs text-slate-500">
                    Published {formatDate(item.publishedAt)} by {item.publishedBy}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.body}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setPreviewItem(item)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Preview announcement"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleTogglePin(item)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.pinned
                      ? 'text-saffron-600 bg-saffron-50 dark:bg-saffron-950/40 hover:bg-saffron-100'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={item.pinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className={`w-4 h-4 ${item.pinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Edit announcement"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteConfirm(item)}
                  className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 border border-dashed rounded-xl">
            No announcements match your search criteria.
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? 'Edit Portal Announcement' : 'Publish New Announcement'}
          size="lg"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Headline / Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Schedule for Satellite Meteorology Winter Module 2026"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Classification *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="announcement">General Training Announcement</option>
                  <option value="notice">Operational Urgent Notice</option>
                  <option value="achievement">Trainee / Centre Achievement</option>
                  <option value="new_content">New Curriculum / Module Release</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Pin to top of public and learner feeds</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Body Content *
              </label>
              <textarea
                rows={5}
                required
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Provide detailed information, dates, instructions, or links..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
              >
                {editingItem ? 'Save Updates' : 'Publish Broadcast'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title={`Confirm Deletion: "${deleteConfirm.title}"`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently remove this announcement? This action will remove it from all portal feeds and record an audit log.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Live Preview Modal */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title="Announcement Preview"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 capitalize">
                {previewItem.type.replace('_', ' ')}
              </span>
              {previewItem.pinned && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-saffron-100 text-saffron-800 dark:bg-saffron-950/50 dark:text-saffron-300">
                  Pinned
                </span>
              )}
              <span className="text-xs text-slate-500">
                {formatDate(previewItem.publishedAt)}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {previewItem.title}
            </h3>

            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {previewItem.body}
            </p>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
