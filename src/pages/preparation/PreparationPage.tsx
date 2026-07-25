import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopics, fetchCategoryBySlug } from '../../api/student';
import { HeroBanner } from '../../components/student/HeroBanner';
import { TopicCard } from '../../components/student/TopicCard';
import { TopicCardSkeleton } from '../../components/student/Skeleton';
import { SearchBar } from '../../components/student/SearchBar';
import { motion } from 'framer-motion';
import { BookOpen, Star, Layers, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const CATEGORY_LABELS: Record<string, string> = {
  gate: 'GATE Preparation', aptitude: 'Aptitude Preparation', interview: 'Interview Preparation', technical: 'Technical Preparation',
};

const CATEGORY_DESCS: Record<string, string> = {
  gate: 'Master your concepts through comprehensive topic-wise preparation for GATE examination.',
  aptitude: 'Strengthen your quantitative and logical reasoning with structured topics.',
  interview: 'Prepare for technical and HR interviews with curated topic-wise resources.',
  technical: 'Deep dive into computer science fundamentals with organized topics.',
};

export default function StudentPreparationPage() {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoryData } = useQuery({
    queryKey: ['prep-dash', category],
    queryFn: () => fetchCategoryBySlug(category!),
    staleTime: 60000,
  });

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['prep-topics', category],
    queryFn: () => fetchTopics(category!).then(d => d.items),
    staleTime: 30000,
  });

  const name = CATEGORY_LABELS[category || ''] || category || '';
  const desc = CATEGORY_DESCS[category || ''] || 'Explore learning materials for this module.';
  const totalTopics = topicsData?.length || 0;
  const totalNotes = categoryData?.notes || 0;
  const totalMcqs = categoryData?.mcqs || 0;
  const totalVideos = categoryData?.videos || 0;

  // Filter & sort topics
  const { featuredTopics, recentTopics, filteredTopics } = useMemo(() => {
    const all = topicsData || [];
    const featured = all.filter((t: any) => t.featured);
    const sorted = [...all].sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    const recent = sorted.slice(0, 6);
    const q = searchQuery.toLowerCase().trim();
    const filtered = q ? all.filter((t: any) => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)) : sorted;
    return { featuredTopics: featured, recentTopics: recent, filteredTopics: filtered };
  }, [topicsData, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner slug={category} title={name} description={desc}>
        <div className="flex flex-wrap gap-6 mt-4">
          <Stat label="Topics" value={totalTopics} />
          <Stat label="Notes" value={totalNotes} />
          <Stat label="MCQs" value={totalMcqs} />
          <Stat label="Videos" value={totalVideos} />
        </div>
      </HeroBanner>

      {/* Search */}
      <div className="max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics by name or description..."
            className="w-full h-12 pl-11 pr-4 text-sm bg-white border border-slate-200 rounded-2xl outline-none transition-all focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* Loading State */}
      {topicsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <TopicCardSkeleton key={i} />)}
        </div>
      ) : topicsData?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-semibold text-slate-600">No topics available</p>
          <p className="text-sm text-slate-400 mt-1">Topics will appear here once added by your admin.</p>
        </div>
      ) : searchQuery ? (
        /* Search Results */
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Search className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-medium text-slate-500">Found {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;</h2>
          </div>
          {filteredTopics.length > 0 ? (
            <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTopics.map((topic: any) => (
                <motion.div key={topic.id} variants={itemAnim}>
                  <TopicCard
                    id={topic.id}
                    categorySlug={category!}
                    name={topic.name}
                    description={topic.description}
                    thumbnail={topic.thumbnail}
                    difficulty={topic.difficulty}
                    estimatedTime={topic.estimatedTime}
                    updatedAt={topic.updatedAt || topic.createdAt}
                    stats={{ notes: topic._count?.studyMaterials || 0, mcqs: topic._count?.mcqQuestions || 0, videos: topic._count?.videos || 0 }}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500">No topics match your search. Try a different term.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Featured Topics */}
          {featuredTopics.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Featured Topics</h2>
              </div>
              <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredTopics.map((topic: any) => (
                  <motion.div key={topic.id} variants={itemAnim}>
                    <TopicCard
                      id={topic.id}
                      categorySlug={category!}
                      name={topic.name}
                      description={topic.description}
                      thumbnail={topic.thumbnail}
                      difficulty={topic.difficulty}
                      estimatedTime={topic.estimatedTime}
                      updatedAt={topic.updatedAt || topic.createdAt}
                      stats={{ notes: topic._count?.studyMaterials || 0, mcqs: topic._count?.mcqQuestions || 0, videos: topic._count?.videos || 0 }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Recently Updated */}
          {recentTopics.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Recently Updated</h2>
              </div>
              <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentTopics.slice(0, 6).map((topic: any) => (
                  <motion.div key={topic.id} variants={itemAnim}>
                    <TopicCard
                      id={topic.id}
                      categorySlug={category!}
                      name={topic.name}
                      description={topic.description}
                      thumbnail={topic.thumbnail}
                      difficulty={topic.difficulty}
                      estimatedTime={topic.estimatedTime}
                      updatedAt={topic.updatedAt || topic.createdAt}
                      stats={{ notes: topic._count?.studyMaterials || 0, mcqs: topic._count?.mcqQuestions || 0, videos: topic._count?.videos || 0 }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* All Topics */}
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-slate-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">All Topics</h2>
              <span className="text-sm text-slate-400">({filteredTopics.length})</span>
            </div>
            {filteredTopics.length > 0 ? (
              <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTopics.map((topic: any) => (
                  <motion.div key={topic.id} variants={itemAnim}>
                    <TopicCard
                      id={topic.id}
                      categorySlug={category!}
                      name={topic.name}
                      description={topic.description}
                      thumbnail={topic.thumbnail}
                      difficulty={topic.difficulty}
                      estimatedTime={topic.estimatedTime}
                      updatedAt={topic.updatedAt || topic.createdAt}
                      stats={{ notes: topic._count?.studyMaterials || 0, mcqs: topic._count?.mcqQuestions || 0, videos: topic._count?.videos || 0 }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-500">No topics available yet.</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Back to home */}
      <div className="text-center pt-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="text-center"><p className="text-xl font-bold">{value}</p><p className="text-xs text-white/70">{label}</p></div>;
}
