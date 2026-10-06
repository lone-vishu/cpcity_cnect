import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bell, Pin, Filter, Calendar, User, ArrowLeft } from 'lucide-react';
import { Announcement, AnnouncementType } from '../../domain/types';
import { announcementService } from '../../services';
import { formatDate } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';

export const AnnouncementsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    announcementService.getAnnouncements().then((data) => {
      setAnnouncements(data);
      if (id) {
        const found = data.find((a) => a.id === id);
        if (found) setSelectedAnnouncement(found);
      }
    });
  }, [id]);

  const filtered = announcements.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const types: { key: string; label: string }[] = [
    { key: 'all', label: 'All Updates' },
    { key: 'notice', label: 'Notices' },
    { key: 'announcement', label: 'Announcements' },
    { key: 'achievement', label: 'Achievements' },
    { key: 'new_content', label: 'New Content' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Departmental Announcements & Updates
        </h1>
        <p className="text-xs text-slate-500">
          Official bulletins, course schedules, capacity building achievements, and resource announcements.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-slate-400 mr-1" />
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              filterType === t.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map((ann) => (
          <div
            key={ann.id}
            onClick={() => setSelectedAnnouncement(ann)}
            className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md dark:bg-slate-900 ${
              ann.pinned
                ? 'border-amber-300 bg-amber-50/20 dark:border-amber-900/40'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  {ann.pinned && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Pin className="h-3 w-3" />
                      <span>PINNED</span>
                    </span>
                  )}
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {ann.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(ann.publishedAt)}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-teal-600 transition-colors">
                  {ann.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{ann.body}</p>
              </div>

              <div className="text-xs text-slate-400 shrink-0 text-right">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{ann.publishedBy}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
          subtitle={`Published by ${selectedAnnouncement.publishedBy} on ${formatDate(
            selectedAnnouncement.publishedAt
          )}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-teal-100 dark:bg-teal-900/50 px-2.5 py-1 text-xs font-bold uppercase text-teal-800 dark:text-teal-300">
                {selectedAnnouncement.type.replace('_', ' ')}
              </span>
              {selectedAnnouncement.pinned && (
                <span className="rounded bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Pin className="h-3 w-3" />
                  <span>Pinned Bulletin</span>
                </span>
              )}
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedAnnouncement.body}
            </p>

            <div className="pt-4 border-t text-right">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close Bulletin
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
