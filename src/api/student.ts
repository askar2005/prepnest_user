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

export async function fetchUserBookmarks() {
  const { data } = await apiClient.get('/student/bookmarks');
  return data as { items: any[]; total: number };
}

export async function toggleBookmark(resource: string, id: string) {
  const { data } = await apiClient.post('/student/bookmarks/toggle', { resource, resourceId: id });
  return data;
}

export async function submitMcqAnswer(mcqId: string, answer: string) {
  const { data } = await apiClient.post('/student/progress/mcq-attempt', { mcqId, answer });
  return data;
}

export async function submitMockTest(mockTestId: string, answers: Record<string, string>) {
  const { data } = await apiClient.post('/student/mock-tests/submit', { mockTestId, answers });
  return data;
}

export async function fetchMockTestDetail(id: string) {
  const { data } = await apiClient.get(`/student/mock-tests/${id}`);
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



// Topic-scoped endpoints
export async function fetchTopicDetail(categorySlug: string, topicId: string) {
  const { data } = await apiClient.get(`/preparation/${categorySlug}/topics/${topicId}`);
  return data;
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
