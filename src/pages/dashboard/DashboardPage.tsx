import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPreparationCategories, fetchUserProgress, fetchDailyChallenges, fetchRecentNotifications } from '../../api/student';
import { useAuth } from '../../context/AuthContext';
import { CategoryCard } from '../../components/student/CategoryCard';
import { FilterChips } from '../../components/student/FilterChip';
import { StreakCard, WeeklyGoalCard } from '../../components/student/ProgressCard';
import { CardSkeleton } from '../../components/student/Skeleton';
import { HeroBanner } from '../../components/student/HeroBanner';
import { Zap, TrendingUp, Bell, ChevronRight, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CATEGORY_SLUGS = ['gate', 'aptitude', 'interview', 'technical'];
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function DashboardPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const { data: categoriesData, isLoading: catsLoading } = useQuery({
    queryKey: ['preparation-categories'],
    queryFn: () => fetchPreparationCategories(),
    staleTime: 60000,
  });

  const { data: progress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: () => fetchUserProgress(),
    staleTime: 30000,
  });

  const { data: challenges } = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => fetchDailyChallenges(),
    staleTime: 30000,
  });

  const { data: recentNotifs } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: () => fetchRecentNotifications(),
    staleTime: 30000,
  });

  const allItems = categoriesData?.items || [];
  const filteredItems = filter === 'all' ? allItems : allItems.filter((c: any) => c.slug === filter || filter === 'recent' || filter === 'popular');
  const displayItems = filteredItems.length > 0 ? filteredItems : allItems;
  const categories = displayItems.filter((c: any) => CATEGORY_SLUGS.includes(c.slug));

  return (
    <div className="space-y-8">
      {/* Hero Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HeroBanner title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`} description="Continue your learning journey with Notes, Videos, MCQs and Mock Tests.">
            <div className="flex gap-3">
              <Link to="/daily-challenge" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl backdrop-blur-sm transition-colors">
                <Zap className="w-4 h-4" /> Daily Challenge
              </Link>
              <Link to="/leaderboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl backdrop-blur-sm transition-colors">
                <TrendingUp className="w-4 h-4" /> Leaderboard
              </Link>
            </div>
          </HeroBanner>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StreakCard streak={progress?.streak || 0} />
          <WeeklyGoalCard progress={progress?.weeklyProgress || 0} target={10} />
        </div>
      </div>

      {/* Daily Challenge Snippet */}
      {challenges && challenges.items && challenges.items.length > 0 && (
        <Link to="/daily-challenge" className="group block rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Daily Challenge Available</p>
                <p className="text-xs text-slate-500">Solve today's challenge and earn points</p>
              </div>
            </div>
            <span className="text-sm font-medium text-amber-600 group-hover:translate-x-1 transition-transform">Start →</span>
          </div>
        </Link>
      )}

      {/* Notifications */}
      {recentNotifs?.items && recentNotifs.items.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-brand-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Important Notifications</h2>
            </div>
            <Link to="/notifications" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentNotifs.items.slice(0, 5).map((n: any) => {
              const fmt = new Date(n.publishDate || n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const priorityStyle = n.priority === 'URGENT' ? 'bg-red-50 text-red-700' : n.priority === 'HIGH' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
              return (
                <Link key={n.id} to={`/notifications/${n.id}`} className="group flex items-start gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-card hover:shadow-hover transition-all hover:-translate-y-0.5">
                  {n.thumbnailUrl ? (
                    <img src={n.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-brand-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600">{n.category?.replace(/_/g, ' ')}</span>
                      {n.priority && <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityStyle}`}>{n.priority}</span>}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{n.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmt}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter Chips */}
      <FilterChips active={filter} onChange={setFilter} />

      {/* Categories Grid */}
      {catsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-slate-600">No categories available</p>
          <p className="text-sm text-slate-400 mt-1">Preparation modules will appear here once added by your admin.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat: any) => (
            <motion.div key={cat.id} variants={itemAnim}>
              <CategoryCard
                slug={cat.slug}
                name={cat.name || CATEGORY_LABELS[cat.slug] || cat.slug}
                description={cat.description || `Master ${cat.name} Preparation with Notes, MCQs, Videos, PYQs and Mock Tests.`}
                coverImage={cat.coverImage}
                gradientColor={cat.gradientColor}
                icon={cat.icon}
                difficulty={DIFFICULTY_MAP[cat.slug] || 'All Levels'}
                stats={{ notes: cat._count?.studyMaterials || 0, mcqs: cat._count?.mcqQuestions || 0, videos: cat._count?.videos || 0, mockTests: cat._count?.mockTests || 0 }}
                progress={Math.min(100, Math.round(((cat._count?.studyMaterials || 0) / 50) * 100))}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  gate: 'GATE Preparation', aptitude: 'Aptitude Preparation', interview: 'Interview Preparation', technical: 'Technical Preparation',
};

const DIFFICULTY_MAP: Record<string, string> = {
  gate: 'Advanced', aptitude: 'Beginner', interview: 'Intermediate', technical: 'Advanced',
};
