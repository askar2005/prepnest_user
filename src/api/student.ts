import { apiClient } from './client';

export async function fetchStudentProfile() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

export async function fetchPreparationCategories() {
  const { data } = await apiClient.get('/preparation-categories', { params: { limit: 50 } });
  return data as { items: any[]; total: number };
}

export async function fetchCategoryBySlug(slug: string) {
  const { data } = await apiClient.get(`/preparation/${slug}/dashboard`);
  return data;
}

export async function fetchTopics(categorySlug: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics`);
  return data as { items: any[]; total: number };
}

export async function fetchNotes(categorySlug: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/notes`);
  return data as { items: any[]; total: number };
}

export async function fetchMcqs(categorySlug: string, params?: Record<string, any>) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/mcqs`, { params });
  return data as { items: any[]; total: number };
}

export async function fetchVideos(categorySlug: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/videos`);
  return data as { items: any[]; total: number };
}

export async function fetchPyqs(categorySlug: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/pyqs`);
  return data as { items: any[]; total: number };
}

export async function fetchMockTests(categorySlug: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/mock-tests`);
  return data as { items: any[]; total: number };
}

export async function submitMcqAnswer(mcqId: string, answer: string) {
  const { data } = await apiClient.post('/student/progress/mcq-attempt', { mcqId, answer });
  return data;
}

export async function submitMockTest(mockTestId: string, answers: Record<string, string | string[]>, timeSpent?: number) {
  const { data } = await apiClient.post('/student/mock-tests/submit', { mockTestId, answers, timeSpent });
  return data;
}

export async function fetchMockTestDetail(id: string) {
  const { data } = await apiClient.get(`/student/mock-tests/${id}`);
  return data;
}

export async function fetchMockTestsList(params?: Record<string, any>) {
  const { data } = await apiClient.get('/mock-tests', { params });
  return data as { items: any[]; total: number; page: number; limit: number };
}

export async function fetchMyMockTestResults(mockTestId?: string) {
  const { data } = await apiClient.get('/student/mock-tests/results', { params: mockTestId ? { mockTestId } : undefined });
  return data as { items: any[]; total: number };
}

export async function fetchMockTestResult(resultId: string) {
  const { data } = await apiClient.get(`/student/mock-tests/results/${resultId}`);
  return data;
}

export async function fetchLeaderboard(categorySlug: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/analytics`);
  return data;
}

export async function fetchUserProgress() {
  const { data } = await apiClient.get('/student/progress');
  return data;
}

export async function getTodayChallenge() {
  const { data } = await apiClient.get('/daily-challenge/today');
  return data as { challenge: any; attempt: any } | null;
}

export async function submitDailyChallengeAttempt(challengeId: string, selectedAnswer: string) {
  const { data } = await apiClient.post(`/daily-challenge/${challengeId}/submit`, { selectedAnswer });
  return data as { attempt: any; correctAnswer: string; explanation: string };
}

export async function getDailyChallengeStreak() {
  const { data } = await apiClient.get('/daily-challenge/streak');
  return data as { currentStreak: number; longestStreak: number; lastCompletedDate: string | null };
}

export async function getDailyChallengeHistory(page = 1, limit = 20) {
  const { data } = await apiClient.get(`/daily-challenge/history?page=${page}&limit=${limit}`);
  return data as { items: any[]; total: number; page: number; limit: number };
}



// Topic-scoped endpoints
export async function fetchTopicDetail(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}`);
  return data;
}

// ─── Discussion ───
export interface DiscussionAuthor {
  id: string | null;
  type: 'admin' | 'user';
  name: string;
}

export interface DiscussionCommentItem {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  replyCount: number;
  depth?: number;
  author: DiscussionAuthor;
}

export interface DiscussionPage {
  items: DiscussionCommentItem[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchDiscussion(topicId: string, page = 1, limit = 20) {
  const { data } = await apiClient.get(`/student/topics/${topicId}/discussion`, { params: { page, limit } });
  return data as DiscussionPage;
}

export async function createDiscussionComment(topicId: string, content: string) {
  const { data } = await apiClient.post(`/student/topics/${topicId}/discussion`, { content });
  return data as DiscussionCommentItem;
}

export async function updateDiscussionComment(commentId: string, content: string) {
  const { data } = await apiClient.put(`/student/discussion/${commentId}`, { content });
  return data as DiscussionCommentItem;
}

export async function deleteDiscussionComment(commentId: string) {
  const { data } = await apiClient.delete(`/student/discussion/${commentId}`);
  return data;
}

export async function fetchDiscussionReplies(commentId: string, page = 1, limit = 20) {
  const { data } = await apiClient.get(`/student/discussion/${commentId}/replies`, { params: { page, limit } });
  return data as DiscussionPage;
}

export async function createDiscussionReply(commentId: string, content: string) {
  const { data } = await apiClient.post(`/student/discussion/${commentId}/reply`, { content });
  return data as DiscussionCommentItem;
}

export async function fetchTopicDashboard(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}/dashboard`);
  return data;
}

export async function fetchTopicNotes(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}/notes`);
  return data as { items: any[]; total: number };
}

export async function fetchTopicMcqs(categorySlug: string, topicId: string, params?: Record<string, any>) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}/mcqs`, { params });
  return data as { items: any[]; total: number };
}

export async function fetchTopicVideos(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}/videos`);
  return data as { items: any[]; total: number };
}

export async function fetchTopicPyqs(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}/pyqs`);
  return data as { items: any[]; total: number };
}

export async function fetchTopicResources(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}/resources`);
  return data as { items: any[]; total: number };
}

export async function fetchTopicMockTests(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}/mock-tests`);
  return data as { items: any[]; total: number };
}

export async function fetchNoteDetail(noteId: string) {
  const { data } = await apiClient.get(`/notes/${noteId}`);
  return data;
}

export async function fetchNotifications(params?: Record<string, any>) {
  const { data } = await apiClient.get('/notifications', { params });
  return data as { items: any[]; total: number; page: number; limit: number };
}

export async function fetchNotificationDetail(id: string) {
  const { data } = await apiClient.get(`/notifications/${id}`);
  return data;
}

export async function fetchRecentNotifications() {
  const { data } = await apiClient.get('/notifications/recent');
  return data as { items: any[]; total: number };
}

export async function fetchUnreadNotificationCount() {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data as { count: number };
}

export async function markNotificationAsRead(id: string) {
  const { data } = await apiClient.post(`/notifications/${id}/read`);
  return data as { ok: boolean };
}

export async function markAllNotificationsAsRead() {
  const { data } = await apiClient.post('/notifications/mark-all-read');
  return data as { ok: boolean; marked: number };
}
