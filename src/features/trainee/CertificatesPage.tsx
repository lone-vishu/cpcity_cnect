import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Printer, Download, CheckCircle2, ShieldCheck, Eye } from 'lucide-react';
import { Certificate } from '../../domain/types';
import { certificateService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../config/app.config';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const CertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    certificateService.getCertificates(currentUser.id).then((certs) => {
      setCertificates(certs);
      setLoading(false);
    });
  }, [currentUser]);

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="no-print">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Accreditation & Completion Certificates
        </h1>
        <p className="text-xs text-slate-500">
          Digital completion credentials awarded upon meeting course attendance and assessment requirements.
        </p>
      </div>

      {/* Certificate cards */}
      <div className="no-print">
        {loading ? (
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ) : certificates.length === 0 ? (
          <EmptyState
            title="No certificates issued yet"
            description="Complete enrolled courses with at least 75% attendance and passing assessment scores to receive automated credentials."
            actionText="Go to My Courses"
            onAction={() => navigate('/trainee/my-courses')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <Award className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Verified Module Credential
                      </span>
                      <div className="text-xs text-slate-400 font-mono">{cert.code}</div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                    {cert.courseTitle}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Awarded to: <strong className="text-slate-800 dark:text-slate-200">{cert.traineeName}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">Issued On: {formatDate(cert.issuedAt)}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Certificate</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCert(cert);
                      setTimeout(() => window.print(), 300);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Viewer Modal & Printable Document */}
      {selectedCert && (
        <Modal
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          title="Certificate Preview"
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* The Certificate Paper Canvas */}
            <div
              id="printable-certificate"
              className="relative overflow-hidden rounded-2xl border-8 border-slate-800 bg-amber-50/30 p-8 sm:p-12 text-center shadow-lg dark:bg-slate-900 dark:border-slate-700"
            >
              {/* Prominent DEMO Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10">
                <span className="text-5xl sm:text-7xl font-black text-rose-600 rotate-[-25deg] tracking-widest uppercase">
                  DEMO — NOT OFFICIAL
                </span>
              </div>

              {/* Watermark Banner */}
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-[11px] font-bold text-amber-900">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-800" />
                <span>{APP_CONFIG.banners.certificateWatermark}</span>
              </div>

              {/* Header Title */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black tracking-widest text-slate-900 dark:text-white uppercase font-serif">
                  Capacity Connect
                </h2>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                  Certificate of Professional Module Completion
                </p>
              </div>

              {/* Recipient */}
              <div className="my-8 space-y-2">
                <p className="text-xs text-slate-500 italic">This is to certify that</p>
                <div className="text-2xl sm:text-3xl font-bold text-teal-800 dark:text-teal-300 font-serif underline decoration-teal-500/30 underline-offset-8">
                  {selectedCert.traineeName}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto pt-2">
                  has satisfactorily fulfilled the curriculum competencies, attendance requirements, and subject assessments for
                </p>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white pt-1">
                  {selectedCert.courseTitle}
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="mt-8 pt-6 border-t border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="font-serif italic font-bold text-slate-800 dark:text-slate-200">
                    Dr. Sunita Kulkarni
                  </div>
                  <div className="text-[10px] text-slate-400">Director of Training (Demo)</div>
                </div>
                <div>
                  <div className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {formatDate(selectedCert.issuedAt)}
                  </div>
                  <div className="text-[10px] text-slate-400">Credential ID: {selectedCert.code}</div>
                </div>
              </div>
            </div>

            {/* Modal action bar */}
            <div className="flex justify-between items-center no-print">
              <span className="text-[11px] text-slate-400">
                Printed output will reflect client-side CSS print styles.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCert(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintCertificate}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
