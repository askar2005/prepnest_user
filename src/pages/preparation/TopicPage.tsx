import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopicDetail, fetchTopicNotes, fetchTopicMcqs, fetchTopicVideos, fetchTopicPyqs, fetchTopicResources, fetchTopicMockTests, submitMcqAnswer, fetchAndOpenFile, fetchAndDownloadFile } from '../../api/student';
import { useToast } from '../../components/common/ToastHost';
import { NoteCard } from '../../components/student/NoteCard';
import { VideoCard } from '../../components/student/VideoCard';
import { Skeleton, CardSkeleton } from '../../components/student/Skeleton';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { BookOpen, HelpCircle, Video, FileText, ClipboardList, Puzzle, ExternalLink, Download, CheckCircle, XCircle, Clock, BarChart3, ChevronRight, MessageCircle, Target, ListChecks } from 'lucide-react';
import { cn } from '../../lib/cn';

type TabKey = 'overview' | 'notes' | 'mcqs' | 'videos' | 'pyqs' | 'mock-tests' | 'resources' | 'discussion';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Target },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'mcqs', label: 'MCQs', icon: HelpCircle },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'pyqs', label: 'PYQs', icon: FileText },
  { key: 'mock-tests', label: 'Mock Tests', icon: ClipboardList },
  { key: 'resources', label: 'Resources', icon: Puzzle },
  { key: 'discussion', label: 'Discussion', icon: MessageCircle },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: 'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-red-50 text-red-700 border-red-200',
};

const ITEM_ANIM = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function fmtMinutes(minutes?: number | null) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Extract active tab from URL ─── */
function useActiveTab(): TabKey {
  const location = useLocation();
  const rest = location.pathname.split('/').pop() || '';
  if (TABS.some(t => t.key === rest)) return rest as TabKey;
  return 'overview';
}

/* ─── Main Component ─── */
export default function TopicPage() {
  const { category, topicId } = useParams<{ category: string; topicId: string }>();
  const navigate = useNavigate();
  const activeTab = useActiveTab();
  const tabBarRef = useRef<HTMLDivElement>(null);
  const loadedTabs = useRef<Set<TabKey>>(new Set(['overview']));

  const { data: topic, isLoading: topicLoading } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => fetchTopicDetail(category!, topicId!),
    staleTime: 60000,
  });

  // Mark overview as loaded
  if (!loadedTabs.current.has('overview')) loadedTabs.current.add('overview');

  const handleTabChange = (tab: TabKey) => {
    loadedTabs.current.add(tab);
    const base = `/preparation/${category}/topics/${topicId}`;
    navigate(tab === 'overview' ? base : `${base}/${tab}`, { replace: true });
  };

  // Hero data
  const name = topic?.name || '';
  const description = topic?.description || '';
  const difficulty = topic?.difficulty || null;
  const estimatedTime = topic?.estimatedTime || null;
  const thumbnail = topic?.thumbnail || null;

  return (
    <div className="min-h-screen">
      {/* ─── Hero Banner ─── */}
      {topicLoading ? (
        <div className="rounded-3xl bg-slate-200 animate-pulse h-64 mb-8" />
      ) : (
        <div
          className={cn(
            'relative rounded-3xl overflow-hidden mb-8',
            thumbnail ? 'h-64' : 'h-52 bg-gradient-to-br from-brand-600 to-brand-800'
          )}
          style={thumbnail ? { backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {thumbnail && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />}

          <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
            {/* Back */}
            <Link
              to={`/preparation/${category}`}
              className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-xl backdrop-blur-sm transition-colors w-fit"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to {category}
            </Link>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1>
              {description && <p className="text-sm text-white/80 line-clamp-2 max-w-2xl">{description}</p>}

              <div className="flex flex-wrap items-center gap-3">
                {difficulty && (
                  <span className={cn('px-3 py-0.5 text-xs font-semibold rounded-full border', DIFFICULTY_STYLES[difficulty] || 'bg-white/20 text-white border-white/30')}>
                    {difficulty}
                  </span>
                )}
                {estimatedTime && (
                  <span className="flex items-center gap-1 text-xs text-white/70"><Clock className="w-3.5 h-3.5" />{fmtMinutes(estimatedTime)}</span>
                )}
                {topic?._count && (
                  <>
                    <span className="text-xs text-white/50">·</span>
                    <span className="text-xs text-white/70">{topic._count.studyMaterials || 0} Notes</span>
                    <span className="text-xs text-white/50">·</span>
                    <span className="text-xs text-white/70">{topic._count.mcqQuestions || 0} MCQs</span>
                    <span className="text-xs text-white/50">·</span>
                    <span className="text-xs text-white/70">{topic._count.videos || 0} Videos</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sticky Tab Bar ─── */}
      <div ref={tabBarRef} className="sticky top-0 z-30 bg-white border-b border-slate-200 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'text-brand-600 border-brand-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="pt-6 pb-20">
        <motion.div key={activeTab} variants={ITEM_ANIM} initial="hidden" animate="show">
          {activeTab === 'overview' && <OverviewTab topic={topic} loading={topicLoading} />}
          {activeTab === 'notes' && <NotesTab category={category!} topicId={topicId!} />}
          {activeTab === 'mcqs' && <McqsTab category={category!} topicId={topicId!} />}
          {activeTab === 'videos' && <VideosTab category={category!} topicId={topicId!} />}
          {activeTab === 'pyqs' && <PyqsTab category={category!} topicId={topicId!} />}
          {activeTab === 'mock-tests' && <MockTestsTab category={category!} topicId={topicId!} />}
          {activeTab === 'resources' && <ResourcesTab category={category!} topicId={topicId!} />}
          {activeTab === 'discussion' && <DiscussionTab />}
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════ OVERVIEW ═══════════ */
function OverviewTab({ topic, loading }: { topic: any; loading: boolean }) {
  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-16 w-3/4" /><Skeleton className="h-48 w-full" /></div>;
  }
  if (!topic) return <div className="text-center py-16 text-slate-500">Topic not found.</div>;

  const stats = [
    { label: 'Notes', value: topic._count?.studyMaterials || 0, icon: BookOpen, color: 'from-blue-500 to-indigo-600' },
    { label: 'MCQs', value: topic._count?.mcqQuestions || 0, icon: HelpCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Videos', value: topic._count?.videos || 0, icon: Video, color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Description */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-3">About This Topic</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{topic.description || 'No description available for this topic.'}</p>
      </section>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topic.difficulty && (
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-card">
            <p className="text-xs text-slate-400 mb-1">Difficulty</p>
            <span className={cn('inline-block px-3 py-0.5 text-xs font-semibold rounded-full border', DIFFICULTY_STYLES[topic.difficulty] || 'bg-slate-50 text-slate-600 border-slate-200')}>
              {topic.difficulty}
            </span>
          </div>
        )}
        {topic.estimatedTime && (
          <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-card">
            <p className="text-xs text-slate-400 mb-1">Estimated Duration</p>
            <p className="text-sm font-semibold text-slate-900">{fmtMinutes(topic.estimatedTime)}</p>
          </div>
        )}
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-card">
          <p className="text-xs text-slate-400 mb-1">Last Updated</p>
          <p className="text-sm font-semibold text-slate-900">
            {topic.updatedAt ? new Date(topic.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-card">
          <p className="text-xs text-slate-400 mb-1">Prerequisites</p>
          <p className="text-sm font-semibold text-slate-900">{topic.tags || 'None'}</p>
        </div>
      </div>

      {/* Resource Counts */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Available Resources</h2>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-card flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', s.color)}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════ NOTES ═══════════ */
function NotesTab({ category, topicId }: { category: string; topicId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['topic-notes', topicId],
    queryFn: () => fetchTopicNotes(category, topicId).then(d => d.items),
    staleTime: 30000,
  });

  if (isLoading) return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>;
  if (!data?.length) return <EmptyState icon={BookOpen} title="No notes yet" message="Notes will appear here once added by your instructor." />;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((n: any) => {
        // Support both new Note model (pdfUrl) and old StudyMaterial model (externalUrl/fileUrl)
        const fileUrl = n.pdfUrl || n.externalUrl || n.fileUrl || null;
        return <NoteCard key={n.id} title={n.title} description={n.description} fileUrl={fileUrl} fileSize={n.fileSize} tags={n.tags || n.tagsString} />;
      })}
    </div>
  );
}

/* ═══════════ MCQs ═══════════ */
function McqsTab({ category, topicId }: { category: string; topicId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['topic-mcqs', topicId],
    queryFn: () => fetchTopicMcqs(category, topicId).then(d => d.items),
    staleTime: 30000,
  });

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!data?.length) return <EmptyState icon={HelpCircle} title="No MCQs yet" message="Practice questions will appear here once added." />;

  return <McqPracticeSection mcqs={data} />;
}

/* ═══════════ VIDEOS ═══════════ */
function VideosTab({ category, topicId }: { category: string; topicId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['topic-videos', topicId],
    queryFn: () => fetchTopicVideos(category, topicId).then(d => d.items),
    staleTime: 30000,
  });

  if (isLoading) return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>;
  if (!data?.length) return <EmptyState icon={Video} title="No videos yet" message="Video lessons will appear here once added." />;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((v: any) => <VideoCard key={v.id} title={v.title} youtubeUrl={v.youtubeUrl} duration={v.duration} views={v.views} />)}
    </div>
  );
}

/* ═══════════ PYQs ═══════════ */
function PyqsTab({ category, topicId }: { category: string; topicId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['topic-pyqs', topicId],
    queryFn: () => fetchTopicPyqs(category, topicId).then(d => d.items),
    staleTime: 30000,
  });

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (!data?.length) return <EmptyState icon={FileText} title="No PYQs yet" message="Previous year questions will appear here once added." />;

  return (
    <div className="space-y-3">
      {data.map((p: any) => (
        <div key={p.id} className="rounded-2xl bg-white border border-slate-100 p-5 flex items-center justify-between shadow-card hover:shadow-hover transition-all">
          <div>
            <p className="text-sm font-semibold text-slate-900">{p.title}</p>
            <p className="text-xs text-slate-400">Year: {p.year}</p>
          </div>
          {p.pdfUrl && <PyqActions url={p.pdfUrl} title={p.title} />}
        </div>
      ))}
    </div>
  );
}

/* ═══════════ MOCK TESTS ═══════════ */
function MockTestsTab({ category, topicId }: { category: string; topicId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['topic-mocktests', topicId],
    queryFn: () => fetchTopicMockTests(category, topicId).then(d => d.items),
    staleTime: 30000,
  });

  if (isLoading) return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>;
  if (!data?.length) return <EmptyState icon={ClipboardList} title="No mock tests yet" message="Practice tests will appear here once added." />;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((t: any) => (
        <div key={t.id} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-card hover:shadow-hover transition-all hover:-translate-y-0.5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
              {t.durationMinutes && <p className="text-[10px] text-slate-400">{t.durationMinutes} min · {t._count?.questions || 0} questions</p>}
            </div>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1">{t.description || 'Test your knowledge with this assessment.'}</p>
          <Link
            to={`/mock-tests/${t.id}`}
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Start Test <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ RESOURCES ═══════════ */
function ResourcesTab({ category, topicId }: { category: string; topicId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['topic-resources', topicId],
    queryFn: () => fetchTopicResources(category, topicId).then(d => d.items),
    staleTime: 30000,
  });

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!data?.length) return <EmptyState icon={Puzzle} title="No resources yet" message="Additional resources will appear here once added." />;

  return (
    <div className="space-y-3">
      {data.map((r: any) => (
        <div key={r.id} className="rounded-2xl bg-white border border-slate-100 p-5 shadow-card hover:shadow-hover transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-900">{r.title}</h3>
                {r.type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium shrink-0">{r.type}</span>}
              </div>
              {r.content && <div className="text-sm text-slate-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: r.content }} />}
            </div>
            {r.externalUrl && (
              <button
                onClick={async () => { try { await fetchAndOpenFile(r.externalUrl); } catch {} }}
                className="shrink-0 flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ DISCUSSION ═══════════ */
function DiscussionTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-lg font-semibold text-slate-600">Discussion Coming Soon</p>
      <p className="text-sm text-slate-400 mt-1">Ask questions and discuss with peers.</p>
    </div>
  );
}

/* ═══════════ SHARED COMPONENTS ═══════════ */

function EmptyState({ icon: Icon, title, message }: { icon: any; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-lg font-semibold text-slate-600">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{message}</p>
    </div>
  );
}

/* ─── MCQ Practice Section ─── */
function McqPracticeSection({ mcqs }: { mcqs: any[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const { pushToast } = useToast();

  if (mcqs.length === 0) return null;
  const mcq = mcqs[currentIdx];
  const isAttempted = attempted[currentIdx];

  const handleSubmit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      setSubmitted(true);
      const correct = selected === mcq.correctOption;
      setIsCorrect(correct);
      setAttempted((prev) => ({ ...prev, [currentIdx]: true }));
      try { await submitMcqAnswer(mcq.id, selected); } catch {}
    } finally { setBusy(false); }
  };

  const goTo = (idx: number) => { setCurrentIdx(idx); setSelected(null); setSubmitted(false); };

  return (
    <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-card">
      <div className="grid lg:grid-cols-[1fr_200px]">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-slate-900">Question {currentIdx + 1}</span>
              <span className="text-slate-400">of {mcqs.length}</span>
              <span className={cn('ml-2 text-xs px-2 py-0.5 rounded-full font-medium', isAttempted ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500')}>
                {isAttempted ? 'Attempted' : 'Not attempted'}
              </span>
            </div>
          </div>

          <p className="text-base font-medium text-slate-900 leading-relaxed">{mcq.question}</p>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].filter((opt) => mcq[`option${opt}`]).map((opt) => {
              const val = mcq[`option${opt}`];
              const isSelected = selected === opt;
              const showCorrect = submitted && opt === mcq.correctOption;
              const showWrong = submitted && isSelected && opt !== mcq.correctOption;
              return (
                <button key={opt} disabled={submitted} onClick={() => setSelected(opt)}
                  className={cn(
                    'w-full text-left px-5 py-3.5 rounded-xl text-sm border transition-all',
                    showCorrect ? 'border-green-400 bg-green-50 text-green-800' :
                    showWrong ? 'border-red-400 bg-red-50 text-red-800' :
                    isSelected ? 'border-brand-400 bg-brand-50 text-brand-700' :
                    'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span className="font-semibold mr-3">{opt}.</span> {val}
                </button>
              );
            })}
          </div>

          {submitted && mcq.explanation && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Explanation</p>
              <p className="text-sm text-slate-600">{mcq.explanation}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {!submitted && <Button onClick={handleSubmit} disabled={!selected || busy}>{busy ? 'Submitting...' : 'Submit Answer'}</Button>}
            {submitted && (
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium"><CheckCircle className="w-5 h-5" /> Correct!</div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-600 font-medium"><XCircle className="w-5 h-5" /> Incorrect</div>
                )}
                {currentIdx < mcqs.length - 1 ? (
                  <Button onClick={() => goTo(currentIdx + 1)}>Next Question →</Button>
                ) : (
                  <Button onClick={() => { pushToast('Completed all questions!', 'success'); }}>Finish</Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-slate-100 p-5 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {mcqs.map((_: any, i: number) => (
              <button key={i} onClick={() => goTo(i)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                  i === currentIdx ? 'ring-2 ring-brand-500 bg-brand-50 text-brand-700' :
                  attempted[i] ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PyqActions({ url, title }: { url: string; title: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex gap-2">
      <button disabled={busy} onClick={async () => { setBusy(true); try { await fetchAndOpenFile(url); } catch {} finally { setBusy(false); } }}
        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
        <ExternalLink className="w-3.5 h-3.5" />{busy ? 'Opening...' : 'View'}
      </button>
      <button disabled={busy} onClick={async () => { setBusy(true); try { await fetchAndDownloadFile(url, `${title}.pdf`); } catch {} finally { setBusy(false); } }}
        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
        <Download className="w-3.5 h-3.5" />{busy ? 'Loading...' : 'Download'}
      </button>
    </div>
  );
}
