import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/useCurrentUser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pin, Trash2, Edit2, MessageSquare, Heart, ThumbsUp, Rocket, ChevronDown, ChevronUp, Zap, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const EMOJI_OPTIONS = ["👍", "👎", "🚀"];

function ReactionButton({ emoji, count, users, onReact, currentUserReacted }) {
  const [showUsers, setShowUsers] = useState(false);

  return (
    <div className="relative">
      <Button
        size="sm"
        variant={currentUserReacted ? "default" : "outline"}
        className={`gap-1 text-xs h-7 px-2 ${
          currentUserReacted ? "brand-gradient text-white border-0" : ""
        }`}
        onClick={() => onReact(emoji)}
      >
        <span>{emoji}</span>
        <span>{count}</span>
      </Button>
      {showUsers && users.length > 0 && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap z-10">
          {users.map((u) => u).join(", ")}
        </div>
      )}
    </div>
  );
}

export default function AnnouncementCard({
  announcement,
  classroom,
  usersMap = {},
  onDelete,
  onPin,
  onEdit,
}) {
  const { user } = useCurrentUser();

  const getDisplayName = (userId, fallback) => {
    const ua = usersMap[userId];
    if (ua) return [ua.first_name, ua.last_name].filter(Boolean).join(" ") || fallback;
    return fallback;
  };
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingContent, setEditingContent] = useState(null);
  const [editDialog, setEditDialog] = useState(false);

  const isAuthor = announcement.author_id === user?.id && !announcement.is_auto_announcement;

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ["announcement-comments", announcement.id],
    queryFn: () =>
      entities.Comment.filter({ announcement_id: announcement.id }),
  });

  // Fetch reactions
  const { data: reactions = [] } = useQuery({
    queryKey: ["announcement-reactions", announcement.id],
    queryFn: () =>
      entities.Reaction.filter({ announcement_id: announcement.id }),
  });

  const reactionSummary = EMOJI_OPTIONS.map((emoji) => {
    const emojiReactions = reactions.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: emojiReactions.length,
      users: emojiReactions.map((r) => r.user_name),
      userReacted: emojiReactions.some((r) => r.user_id === user?.id),
    };
  });

  const handleAddReaction = async (emoji) => {
    const existing = reactions.find(
      (r) => r.emoji === emoji && r.user_id === user?.id
    );
    if (existing) {
      await entities.Reaction.delete(existing.id);
    } else {
      await entities.Reaction.create({
        announcement_id: announcement.id,
        user_id: user?.id,
        user_name: user?.full_name,
        emoji,
      });
    }
    queryClient.invalidateQueries({
      queryKey: ["announcement-reactions", announcement.id],
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await entities.Comment.create({
      announcement_id: announcement.id,
      author_id: user?.id,
      author_name: user?.full_name,
      author_email: user?.email,
      author_avatar: user?.avatar_url || "",
      content: newComment,
    });
    setNewComment("");
    queryClient.invalidateQueries({
      queryKey: ["announcement-comments", announcement.id],
    });
  };

  const handleDeleteComment = async (commentId) => {
    await entities.Comment.delete(commentId);
    queryClient.invalidateQueries({
      queryKey: ["announcement-comments", announcement.id],
    });
  };

  const handleSaveEdit = async () => {
    if (!editingContent?.trim()) return;
    await entities.Announcement.update(announcement.id, {
      content: editingContent,
    });
    setEditDialog(false);
    setEditingContent(null);
    queryClient.invalidateQueries({
      queryKey: ["classroom-announcements", classroom.id],
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">
                {getDisplayName(announcement.author_id, announcement.author_name)}
              </h3>
              {announcement.is_auto_announcement && (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                  <Zap className="w-3 h-3" />
                  System
                </Badge>
              )}
              {announcement.status === "pending_approval" && (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                  Pending Approval
                </Badge>
              )}
              {announcement.is_pinned && (
                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs gap-1">
                  <Pin className="w-3 h-3" />
                  Pinned
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {format(new Date(announcement.created_date), "MMM d, yyyy · h:mm a")}
            </p>
          </div>
          {isAuthor && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingContent(announcement.content);
                  setEditDialog(true);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 h-auto w-auto"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(announcement.id)}
                className="text-gray-400 hover:text-red-600 p-1 h-auto w-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-gray-700 mb-3">
          {announcement.is_auto_announcement ? (
            <ReactMarkdown>{announcement.content}</ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{announcement.content}</p>
          )}
        </div>

        {/* Auto-Announcement CTA Button */}
        {announcement.is_auto_announcement && announcement.metadata?.lesson_number && (
          <Link
            to={`/Viewer?yearLevel=${announcement.metadata.year_level_key}&lesson=${announcement.metadata.lesson_number}&classroomId=${announcement.classroom_id}`}
            className="mb-3 inline-block"
          >
            <Button size="sm" className="brand-gradient text-white rounded-full gap-1">
              <BookOpen className="w-4 h-4" />
              Go to Lesson
            </Button>
          </Link>
        )}

        {/* Images */}
        {announcement.images && announcement.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {announcement.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="Announcement"
                className="rounded-lg max-h-48 object-cover"
              />
            ))}
          </div>
        )}

        {/* Attachments */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="space-y-1 mb-3 p-2 bg-gray-50 rounded-lg">
            {announcement.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                download
                className="text-xs text-blue-600 hover:underline block truncate"
              >
                📎 {att.name}
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {reactionSummary.map((r) => (
            <ReactionButton
              key={r.emoji}
              emoji={r.emoji}
              count={r.count}
              users={r.users}
              onReact={handleAddReaction}
              currentUserReacted={r.userReacted}
            />
          ))}
        </div>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
          {showComments ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">
                    {getDisplayName(comment.author_id, comment.author_name)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(comment.created_date), "MMM d, h:mm a")}
                  </p>
                </div>
                {comment.author_id === user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-400 hover:text-red-600 p-1 h-auto w-auto flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add Comment Input */}
            <div className="flex gap-2 pt-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="brand-gradient text-white h-auto px-3 py-2 flex-shrink-0"
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingContent || ""}
            onChange={(e) => setEditingContent(e.target.value)}
            className="resize-none"
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="brand-gradient text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}