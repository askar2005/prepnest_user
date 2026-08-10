import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDiscussion,
  createDiscussionComment,
  updateDiscussionComment,
  deleteDiscussionComment,
  fetchDiscussionReplies,
  createDiscussionReply,
  type DiscussionCommentItem,
  type DiscussionPage,
} from '../../api/student';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastHost';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MessageCircle, Send, Pencil, Trash2, ChevronDown, ShieldCheck, X } from 'lucide-react';
import { cn } from '../../lib/cn';

const MAX_LEN = 1000;

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function Avatar({ name, isAdmin, size = 'md' }: { name: string; isAdmin: boolean; size?: 'md' | 'sm' }) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
        isAdmin
          ? 'bg-gradient-to-br from-brand-500 to-brand-700'
          : 'bg-gradient-to-br from-slate-400 to-slate-600',
        size === 'md' ? 'w-9 h-9 text-xs' : 'w-7 h-7 text-[10px]'
      )}
    >
      {initials(name) || '?'}
    </div>
  );
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wide">
      <ShieldCheck className="w-3 h-3" /> Admin
    </span>
  );
}

export default function DiscussionSection({ topicId }: { topicId: string }) {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('');
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const listKey = ['discussion', topicId] as const;

  const { data, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => fetchDiscussion(topicId, page),
    staleTime: 30000,
  });

  const comments = data?.items || [];
  const hasMore = (data?.total ?? 0) > page * 20;

  const createMutation = useMutation({
    mutationFn: (content: string) => createDiscussionComment(topicId, content),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: listKey });
      const prev = qc.getQueryData<DiscussionPage>(listKey);
      if (prev) {
        qc.setQueryData<DiscussionPage>(listKey, {
          ...prev,
          items: [...prev.items, { id: `temp-${Date.now()}`, content, isEdited: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), parentId: null, replyCount: 0, author: { id: user?.id ?? null, type: 'user', name: user?.name || 'You' } } as DiscussionCommentItem],
          total: prev.total + 1,
        });
      }
      return { prev };
    },
    onSuccess: () => {
      pushToast('Comment posted', 'success');
      setDraft('');
      qc.invalidateQueries({ queryKey: listKey });
    },
    onError: (err: any, _content, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev);
      pushToast(err?.response?.data?.message || err?.message || 'Failed to post comment', 'error');
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Composer (WhatsApp-style, sticky on mobile) */}
      <div className="sticky bottom-0 z-20 -mx-4 px-4 py-3 bg-gradient-to-t from-white via-white/95 to-transparent">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
          <textarea
            ref={composerRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim() && !createMutation.isPending) createMutation.mutate(draft.trim());
              }
            }}
            placeholder="Ask a doubt or share your thoughts…"
            rows={2}
            maxLength={MAX_LEN}
            className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className={cn('text-[10px] tabular-nums', draft.length > MAX_LEN - 50 ? 'text-amber-600' : 'text-slate-300')}>{draft.length}/{MAX_LEN}</span>
            <button
              onClick={() => draft.trim() && createMutation.mutate(draft.trim())}
              disabled={!draft.trim() || createMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" /> {createMutation.isPending ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <MessageCircle className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-600">No discussion yet</p>
          <p className="text-sm text-slate-400 mt-1">Be the first to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <CommentCard key={c.id} topicId={topicId} comment={c} listKey={listKey} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button onClick={() => setPage((p) => p + 1)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Load more comments
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════ Single comment (top-level) ═══════════ */
function CommentCard({ topicId, comment, listKey }: { topicId: string; comment: DiscussionCommentItem; listKey: readonly ['discussion', string] }) {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [replyDraft, setReplyDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAdmin = comment.author.type === 'admin';
  const isOwn = comment.author.type === 'user' && comment.author.id === user?.id;
  const repliesKey = ['discussion-replies', comment.id] as const;

  const { data: repliesData } = useQuery({
    queryKey: repliesKey,
    queryFn: () => fetchDiscussionReplies(comment.id, 1),
    enabled: showReplies,
    staleTime: 30000,
  });
  const replies = repliesData?.items || [];
  const repliesTotal = repliesData?.total ?? comment.replyCount;

  const replyMutation = useMutation({
    mutationFn: (content: string) => createDiscussionReply(comment.id, content),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: repliesKey });
      const prev = qc.getQueryData<DiscussionPage>(repliesKey);
      if (prev) {
        qc.setQueryData<DiscussionPage>(repliesKey, {
          ...prev,
          items: [...prev.items, { id: `temp-${Date.now()}`, content, isEdited: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), parentId: comment.id, replyCount: 0, depth: 1, author: { id: user?.id ?? null, type: 'user', name: user?.name || 'You' } } as DiscussionCommentItem],
          total: prev.total + 1,
        });
      } else {
        qc.setQueryData<DiscussionPage>(repliesKey, {
          items: [{ id: `temp-${Date.now()}`, content, isEdited: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), parentId: comment.id, replyCount: 0, depth: 1, author: { id: user?.id ?? null, type: 'user', name: user?.name || 'You' } } as DiscussionCommentItem],
          total: 1,
          page: 1,
          limit: 20,
        });
      }
      qc.setQueryData<DiscussionPage>(listKey, (old) => old ? { ...old, items: old.items.map((i) => i.id === comment.id ? { ...i, replyCount: i.replyCount + 1 } : i) } : old);
      return { prev };
    },
    onSuccess: () => {
      pushToast('Reply added', 'success');
      setReplyDraft('');
      setReplying(false);
      qc.invalidateQueries({ queryKey: repliesKey });
      qc.invalidateQueries({ queryKey: listKey });
    },
    onError: (err: any, _c, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(repliesKey, ctx.prev);
      pushToast(err?.response?.data?.message || err?.message || 'Failed to add reply', 'error');
    },
  });

  const editMutation = useMutation({
    mutationFn: (content: string) => updateDiscussionComment(comment.id, content),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: listKey });
      const prev = qc.getQueryData<DiscussionPage>(listKey);
      if (prev) {
        qc.setQueryData<DiscussionPage>(listKey, {
          ...prev,
          items: prev.items.map((i) => (i.id === comment.id ? { ...i, content, isEdited: true } : i)),
        });
      }
      return { prev };
    },
    onSuccess: () => {
      pushToast('Comment updated', 'success');
      setEditing(false);
      qc.invalidateQueries({ queryKey: listKey });
    },
    onError: (err: any, _c, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev);
      pushToast(err?.response?.data?.message || err?.message || 'Failed to update', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDiscussionComment(comment.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: listKey });
      const prev = qc.getQueryData<DiscussionPage>(listKey);
      if (prev) {
        qc.setQueryData<DiscussionPage>(listKey, {
          ...prev,
          items: prev.items.filter((i) => i.id !== comment.id),
          total: prev.total - 1,
        });
      }
      return { prev };
    },
    onSuccess: () => {
      pushToast('Comment deleted', 'success');
      setConfirmDelete(false);
      qc.invalidateQueries({ queryKey: listKey });
    },
    onError: (err: any, _c, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev);
      pushToast(err?.response?.data?.message || err?.message || 'Failed to delete', 'error');
    },
  });

  return (
    <div className={cn('rounded-2xl border bg-white shadow-card overflow-hidden', isAdmin ? 'border-brand-200' : 'border-slate-100')}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={comment.author.name} isAdmin={isAdmin} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('text-sm font-semibold', isAdmin ? 'text-brand-700' : 'text-slate-900')}>{comment.author.name}</span>
              {isAdmin && <AdminBadge />}
              <span className="text-[11px] text-slate-400">{timeAgo(comment.createdAt)}</span>
              {comment.isEdited && <span className="text-[10px] text-slate-400 italic">Edited</span>}
            </div>

            {editing ? (
              <div className="mt-2">
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_LEN))}
                  rows={3}
                  maxLength={MAX_LEN}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => editDraft.trim() && editMutation.mutate(editDraft.trim())}
                    disabled={!editDraft.trim() || editMutation.isPending}
                    className="h-8 px-3 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    {editMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setEditDraft(comment.content); }} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
            )}

            <div className="flex items-center gap-4 mt-2">
              <button onClick={() => setReplying((r) => !r)} className="text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors">Reply</button>
              {isOwn && (
                <>
                  <button onClick={() => { setEditing(true); setEditDraft(comment.content); }} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </>
              )}
            </div>

            {replying && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value.slice(0, MAX_LEN))}
                  rows={2}
                  maxLength={MAX_LEN}
                  placeholder={`Reply to ${comment.author.name}…`}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={cn('text-[10px] tabular-nums', replyDraft.length > MAX_LEN - 50 ? 'text-amber-600' : 'text-slate-300')}>{replyDraft.length}/{MAX_LEN}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setReplying(false); setReplyDraft(''); }} className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-100">
                      Cancel
                    </button>
                    <button
                      onClick={() => replyDraft.trim() && replyMutation.mutate(replyDraft.trim())}
                      disabled={!replyDraft.trim() || replyMutation.isPending}
                      className="h-8 px-3 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                      {replyMutation.isPending ? 'Posting…' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {repliesTotal > 0 && (
        <div className="border-t border-slate-50">
          <button onClick={() => setShowReplies((s) => !s)} className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-brand-600 hover:text-brand-700">
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showReplies && 'rotate-180')} />
            {showReplies ? 'Hide replies' : `View ${repliesTotal} ${repliesTotal === 1 ? 'reply' : 'replies'}`}
          </button>
          {showReplies && (
            <div className="px-4 pb-3 space-y-3">
              {replies.length === 0 && <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />}
              {replies.map((r) => (
                <ReplyRow key={r.id} reply={r} parentCommentId={comment.id} repliesKey={repliesKey} />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete comment?"
        message="This will permanently remove the comment and its replies."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/* ═══════════ Single reply ═══════════ */
function ReplyRow({ reply, parentCommentId, repliesKey }: { reply: DiscussionCommentItem; parentCommentId: string; repliesKey: readonly ['discussion-replies', string] }) {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(reply.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAdmin = reply.author.type === 'admin';
  const isOwn = reply.author.type === 'user' && reply.author.id === user?.id;

  const editMutation = useMutation({
    mutationFn: (content: string) => updateDiscussionComment(reply.id, content),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: repliesKey });
      const prev = qc.getQueryData<DiscussionPage>(repliesKey);
      if (prev) {
        qc.setQueryData<DiscussionPage>(repliesKey, {
          ...prev,
          items: prev.items.map((i) => (i.id === reply.id ? { ...i, content, isEdited: true } : i)),
        });
      }
      return { prev };
    },
    onSuccess: () => {
      pushToast('Reply updated', 'success');
      setEditing(false);
      qc.invalidateQueries({ queryKey: repliesKey });
    },
    onError: (err: any, _c, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(repliesKey, ctx.prev);
      pushToast(err?.response?.data?.message || err?.message || 'Failed to update', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDiscussionComment(reply.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: repliesKey });
      const prev = qc.getQueryData<DiscussionPage>(repliesKey);
      if (prev) {
        qc.setQueryData<DiscussionPage>(repliesKey, {
          ...prev,
          items: prev.items.filter((i) => i.id !== reply.id),
          total: prev.total - 1,
        });
      }
      return { prev };
    },
    onSuccess: () => {
      pushToast('Reply deleted', 'success');
      setConfirmDelete(false);
      qc.invalidateQueries({ queryKey: repliesKey });
    },
    onError: (err: any, _c, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(repliesKey, ctx.prev);
      pushToast(err?.response?.data?.message || err?.message || 'Failed to delete', 'error');
    },
  });

  return (
    <div className={cn('flex items-start gap-2.5', reply.depth === 2 && 'ml-6 md:ml-8')}>
      <Avatar name={reply.author.name} isAdmin={isAdmin} size="sm" />
      <div className={cn('flex-1 min-w-0 rounded-xl px-3 py-2.5', isAdmin ? 'bg-brand-50/60 border border-brand-100' : 'bg-slate-50 border border-slate-100')}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('text-xs font-semibold', isAdmin ? 'text-brand-700' : 'text-slate-800')}>{reply.author.name}</span>
          {isAdmin && <AdminBadge />}
          <span className="text-[10px] text-slate-400">{timeAgo(reply.createdAt)}</span>
          {reply.isEdited && <span className="text-[10px] text-slate-400 italic">Edited</span>}
        </div>
        {editing ? (
          <div className="mt-1.5">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_LEN))}
              rows={2}
              maxLength={MAX_LEN}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <div className="flex items-center gap-2 mt-1.5">
              <button onClick={() => editDraft.trim() && editMutation.mutate(editDraft.trim())} disabled={!editDraft.trim() || editMutation.isPending} className="h-7 px-2.5 rounded-md bg-brand-600 text-white text-[11px] font-medium hover:bg-brand-700 disabled:opacity-50">
                {editMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setEditDraft(reply.content); }} className="h-7 px-2.5 rounded-md border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-slate-700 whitespace-pre-wrap break-words">{reply.content}</p>
        )}
        {isOwn && (
          <div className="flex items-center gap-3 mt-1.5">
            <button onClick={() => { setEditing(true); setEditDraft(reply.content); }} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-600"><Pencil className="w-3 h-3" /> Edit</button>
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600"><Trash2 className="w-3 h-3" /> Delete</button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete reply?"
        message="This will permanently remove the reply."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
