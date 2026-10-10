import { useState } from 'react';
import { Award, CheckCircle2, Download, ExternalLink, ShieldCheck, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Modal } from '@/components/ui';

export type Certificate = {
  id: string;
  courseTitle: string;
  credentialId: string;
  issueDate: string;
  grade: string;
  instructorName: string;
  status: 'Issued' | 'In progress';
  progressPercent?: number;
};

const seedCertificates: Certificate[] = [
  {
    id: 'cert-1',
    courseTitle: 'Agile & Git Team Workflows',
    credentialId: 'TH-2026-GIT-0921',
    issueDate: '2026-09-28',
    grade: '100% (High Honors)',
    instructorName: 'Omar Hassan',
    status: 'Issued',
  },
  {
    id: 'cert-2',
    courseTitle: 'Frontend Foundations with React',
    credentialId: 'TH-2026-FED-0442',
    issueDate: '2026-09-15',
    grade: '94% (Distinction)',
    instructorName: 'Sarah Jenkins',
    status: 'Issued',
  },
  {
    id: 'cert-3',
    courseTitle: 'Fullstack Web Development Professional',
    credentialId: 'TH-2026-FSW-PENDING',
    issueDate: 'Estimated Nov 2026',
    grade: 'Current: 92%',
    instructorName: 'Sarah Jenkins',
    status: 'In progress',
    progressPercent: 62,
  },
];

export default function CertificatesList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t('Learning')}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t('Certificates & Credentials')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('View, verify, and share your earned course certificates and qualifications.')}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {seedCertificates.map((cert) => (
          <Card key={cert.id} className="relative overflow-hidden border-border bg-card/70 transition hover:border-border/80">
            <div className="absolute end-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-primary/10 blur-xl pointer-events-none" />
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Award className="size-5" />
                </span>
                <Badge variant={cert.status === 'Issued' ? 'success' : 'warning'}>
                  {t(cert.status)}
                </Badge>
              </div>
              <CardTitle className="mt-3 text-base leading-snug">{cert.courseTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0 text-xs text-muted-foreground">
              <div className="space-y-1.5 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span>{t('Credential ID')}:</span>
                  <span className="font-mono text-foreground">{cert.credentialId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('Date')}:</span>
                  <span className="text-foreground">{cert.issueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('Grade')}:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{cert.grade}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('Instructor')}:</span>
                  <span className="text-foreground">{cert.instructorName}</span>
                </div>
              </div>

              {cert.status === 'Issued' ? (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedCert(cert)}
                    leadingIcon={<ShieldCheck className="size-3.5 text-primary" />}
                  >
                    {t('View certificate')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px]">
                    <span>{t('Curriculum progress')}</span>
                    <span className="font-semibold text-foreground">{cert.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${cert.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCert && (
        <Modal
          open={Boolean(selectedCert)}
          onClose={() => setSelectedCert(null)}
          title={t('Certificate Verification')}
          size="lg"
        >
          <div className="rounded-xl border-2 border-primary/20 bg-card p-6 text-center shadow-lg">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Award className="size-8" />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">
              TrainHub Verified Certificate
            </p>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              {t('Certificate of Achievement')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('This certifies that')}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{user?.name || 'David Kim'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('has successfully completed the program')}</p>
            <p className="mt-1 font-semibold text-primary">{selectedCert.courseTitle}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="text-start">
                <p className="text-[11px] font-medium">{t('Instructor Signature')}</p>
                <p className="mt-1 font-serif text-sm italic text-foreground">{selectedCert.instructorName}</p>
                <p className="text-[10px] text-muted-foreground">{selectedCert.issueDate}</p>
              </div>
              <div className="text-end">
                <p className="text-[11px] font-medium">{t('Verification Token')}</p>
                <p className="mt-1 font-mono text-[11px] text-foreground">{selectedCert.credentialId}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                  <CheckCircle2 className="size-3" /> {t('Verified & Authenticated')}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={() => setSelectedCert(null)}>
              {t('Close')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
