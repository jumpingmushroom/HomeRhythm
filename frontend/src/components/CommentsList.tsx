import { useState, useEffect } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useAuthStore } from '../store/authStore';
import { commentsApi } from '../lib/api';
import { TaskCommentWithUser } from '../types';

interface CommentsListProps {
  taskId: number;
}

export default function CommentsList({ taskId }: CommentsListProps) {
  const { comments, setComments, addComment, updateComment, deleteComment } = useTasksStore();
  const { user } = useAuthStore();
  const [newCommentText, setNewCommentText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const taskComments = comments[taskId] || [];

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentsApi.getForTask(taskId);
      setComments(taskId, response.data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await commentsApi.create(taskId, {
        comment_text: newCommentText.trim(),
      });
      addComment(response.data.comment);
      setNewCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: TaskCommentWithUser) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editText.trim()) return;

    try {
      const response = await commentsApi.update(commentId, {
        comment_text: editText.trim(),
      });
      updateComment(response.data.comment);
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsApi.delete(commentId);
      deleteComment(taskId, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">Comments</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Comments ({taskComments.length})
      </h3>

      {/* Comments list */}
      <div className="space-y-4">
        {taskComments.map((comment) => (
          <div key={comment.id} className="border-l-2 border-gray-300 pl-4">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {comment.user_email}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {formatDate(comment.created_at)}
                </span>
                {comment.updated_at !== comment.created_at && (
                  <span className="text-xs text-gray-500 ml-1">(edited)</span>
                )}
              </div>
              {user && comment.user_id === user.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(comment)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(comment.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.comment_text}
              </p>
            )}
          </div>
        ))}

        {taskComments.length === 0 && (
          <p className="text-sm text-gray-500 italic">No comments yet</p>
        )}
      </div>

      {/* Add new comment */}
      <div className="space-y-2">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          rows={3}
          disabled={isSubmitting}
        />
        <button
          onClick={handleAddComment}
          disabled={isSubmitting || !newCommentText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? 'Adding...' : 'Add Comment'}
        </button>
      </div>
    </div>
  );
}
