import React, { useState, useEffect } from 'react';
import {
  Layers,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  Video,
  FileText,
  FileSpreadsheet,
  Globe,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Resource, Course, ResourceType, ResourceVisibility } from '../../domain/types';
import { resourceService, courseService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { formatDate } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';

export const TrainerLibraryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resType, setResType] = useState<ResourceType>('slides');
  const [visibility, setVisibility] = useState<ResourceVisibility>('enrolled');
  const [courseId, setCourseId] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(5000000);

  // Delete modal state
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    const [allRes, allCourses] = await Promise.all([
      resourceService.getResources(),
      courseService.getCourses(),
    ]);
    setResources(allRes);
    const myCourses = allCourses.filter((c) => c.trainerId === currentUser.id);
    setCourses(myCourses);
    if (myCourses.length > 0 && !courseId) {
      setCourseId(myCourses[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !currentUser) {
      showToast('Please provide title and description', 'warning');
      return;
    }

    try {
      await resourceService.createResource({
        title: title.trim(),
        description: description.trim(),
        type: resType,
        visibility,
        courseId: courseId || undefined,
        trainerId: currentUser.id,
        fileMeta: {
          name: uploadedFileName || `training_asset_${Date.now()}.pdf`,
          sizeBytes: fileSizeBytes,
          mimeType: resType === 'video' ? 'video/mp4' : 'application/pdf',
          url: '/demo-files/training_asset.pdf',
        },
      });

      showToast('Learning material uploaded to Trainer Library', 'success');
      setIsUploadModalOpen(false);
      setTitle('');
      setDescription('');
      setUploadedFileName('');
      loadData();
    } catch (err: any) {
      showToast('Failed to upload material', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingResource) return;
    await resourceService.deleteResource(deletingResource.id);
    showToast(`"${deletingResource.title}" deleted from library`, 'info');
    setDeletingResource(null);
    loadData();
  };

  const filtered = resources.filter((res) => {
    if (filterType !== 'all' && res.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return res.title.toLowerCase().includes(q) || res.description.toLowerCase().includes(q);
    }
    return true;
  });

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Trainer Content Library
          </h1>
          <p className="text-xs text-slate-500">
            Upload recorded lectures, slide decks, and metrology documents shared with trainee cohorts.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-teal-700 shadow-sm"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search learning materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All File Formats</option>
            <option value="video">Videos / Lectures</option>
            <option value="slides">Presentations / Slides</option>
            <option value="document">Documentation / SOPs</option>
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Asset Title & Description</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Visibility Scope</th>
                <th className="p-3.5">Associated Course</th>
                <th className="p-3.5">Uploaded</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 max-w-xs">
                    <div className="font-bold text-slate-900 dark:text-white">{res.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{res.description}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      {res.type}
                    </span>
                  </td>
                  <td className="p-3.5 capitalize text-slate-600 dark:text-slate-400">
                    {res.visibility.replace('_', ' ')}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {res.courseId ? courseMap.get(res.courseId) || 'Assigned Course' : 'Public Library'}
                  </td>
                  <td className="p-3.5 text-slate-500">{formatDate(res.uploadedAt)}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => showToast(`Previewing "${res.title}"`, 'info')}
                        className="rounded p-1 text-slate-400 hover:text-teal-600"
                        title="Preview"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingResource(res)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Learning Resource"
        subtitle="Supported formats: MP4 recorded lectures, PDF presentations, manuals"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Resource Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. S-Band Radar Volume Scanning Best Practices"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Brief Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of topics covered and study recommendations"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Asset Type</label>
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value as any)}
                className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="slides">Presentation (PDF)</option>
                <option value="video">Recorded Video Lecture</option>
                <option value="document">Technical Document / Manual</option>
                <option value="link">External Reference Link</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Visibility Scope</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="enrolled">Enrolled Cohort Only</option>
                <option value="public_trainees">All Registered Trainees</option>
                <option value="trainers_only">Faculty Internal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Associate with Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">General Library (No specific course)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Choose File (Simulated Picker)</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setUploadedFileName(file.name);
                  setFileSizeBytes(file.size);
                }
              }}
              className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
            />
            {uploadedFileName && (
              <p className="mt-1 text-[11px] text-teal-600 font-medium">Selected: {uploadedFileName}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              Upload Material
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingResource && (
        <Modal
          isOpen={!!deletingResource}
          onClose={() => setDeletingResource(null)}
          title="Confirm Material Deletion"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletingResource.title}"</strong> from the library? Enrolled students will no longer be able to download this asset.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingResource(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Delete Resource
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
