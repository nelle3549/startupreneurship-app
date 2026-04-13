import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle } from "lucide-react";
import AnnouncementCard from "./AnnouncementCard";

export default function AnnouncementsSection({ classroom }) {
  const { user, isFacilitator, isAdmin } = useCurrentUser();
  const queryClient = useQueryClient();
  const isPrivileged = isFacilitator || isAdmin;

  const [newAnnouncementDialog, setNewAnnouncementDialog] = useState(false);
  const [requestPostDialog, setRequestPostDialog] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [requestContent, setRequestContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all UserAccounts to resolve names dynamically
  const { data: allUserAccounts = [] } = useQuery({
    queryKey: ["all-user-accounts-map"],
    queryFn: () => base44.entities.UserAccount.list(),
    staleTime: 1000 * 60 * 5,
  });

  const usersMap = Object.fromEntries(allUserAccounts.map(u => [u.user_id, u]));

  const getDisplayName = (userId, fallback) => {
    const ua = usersMap[userId];
    if (ua) return [ua.first_name, ua.last_name].filter(Boolean).join(" ") || fallback;
    return fallback;
  };

  // Fetch announcements
  const { data: announcements = [], refetch: refetchAnnouncements } = useQuery({
    queryKey: ["classroom-announcements", classroom.id],
    queryFn: () =>
      base44.entities.Announcement.filter({ classroom_id: classroom.id }),
  });

  // Fetch pending approval announcements (facilitators only)
  const { data: pendingAnnouncements = [], refetch: refetchPending } = useQuery({
    queryKey: ["pending-announcements", classroom.id],
    queryFn: () =>
      base44.entities.Announcement.filter({
        classroom_id: classroom.id,
        status: "pending_approval",
      }),
    enabled: isPrivileged,
  });

  const publishedAnnouncements = announcements
    .filter((a) => a.status === "published")
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });

  const handlePublishAnnouncement = async () => {
    if (!announcementContent.trim()) return;
    setLoading(true);
    await base44.entities.Announcement.create({
      classroom_id: classroom.id,
      author_id: user?.id,
      author_name: user?.full_name,
      author_email: user?.email,
      author_avatar: user?.avatar_url || "",
      title: announcementTitle || null,
      content: announcementContent,
      status: "published",
      is_pinned: false,
    });
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setNewAnnouncementDialog(false);
    setLoading(false);
    refetchAnnouncements();
  };

  const handleRequestPost = async () => {
    if (!requestContent.trim()) return;
    setLoading(true);
    await base44.entities.Announcement.create({
      classroom_id: classroom.id,
      author_id: user?.id,
      author_name: user?.full_name,
      author_email: user?.email,
      author_avatar: user?.avatar_url || "",
      content: requestContent,
      status: "pending_approval",
      is_pinned: false,
    });
    setRequestContent("");
    setRequestPostDialog(false);
    setLoading(false);
    refetchPending();
  };

  const handleApprovePost = async (announcementId) => {
    await base44.entities.Announcement.update(announcementId, {
      status: "published",
    });
    refetchAnnouncements();
    refetchPending();
  };

  const handleDenyPost = async (announcementId) => {
    await base44.entities.Announcement.delete(announcementId);
    refetchPending();
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    await base44.entities.Announcement.delete(announcementId);
    refetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      {/* Facilitator Controls */}
      {isPrivileged && (
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setNewAnnouncementDialog(true)}
            className="brand-gradient text-white rounded-full gap-2"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        </div>
      )}

      {/* Student Post Request Button */}
      {!isPrivileged && (
        <Button
          onClick={() => setRequestPostDialog(true)}
          variant="outline"
          className="w-full gap-2 rounded-full"
        >
          <Plus className="w-4 h-4" />
          Request to Post
        </Button>
      )}

      {/* Pending Approvals Section (Facilitators Only) */}
      {isPrivileged && pendingAnnouncements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Pending Post Requests ({pendingAnnouncements.length})
          </h3>
          <div className="space-y-3">
            {pendingAnnouncements.map((ann) => (
              <div key={ann.id} className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>{getDisplayName(ann.author_id, ann.author_name)}</strong> requested to post
                </p>
                <p className="text-sm text-gray-700 mb-3">{ann.content}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprovePost(ann.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDenyPost(ann.id)}
                    className="text-xs px-4"
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published Announcements */}
      <div className="space-y-3">
        {publishedAnnouncements.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 text-sm">No announcements yet.</p>
          </div>
        ) : (
          publishedAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              classroom={classroom}
              usersMap={usersMap}
              onDelete={handleDeleteAnnouncement}
              onPin={() => {}}
              onEdit={() => {}}
            />
          ))
        )}
      </div>

      {/* New Announcement Dialog */}
      <Dialog open={newAnnouncementDialog} onOpenChange={setNewAnnouncementDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Title (optional)"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="What would you like to announce?"
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewAnnouncementDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishAnnouncement}
              disabled={!announcementContent.trim() || loading}
              className="brand-gradient text-white"
            >
              {loading ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Post Request Dialog */}
      <Dialog open={requestPostDialog} onOpenChange={setRequestPostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Post</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Write your announcement here..."
            value={requestContent}
            onChange={(e) => setRequestContent(e.target.value)}
            className="resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-500">
            Your post will be reviewed and approved by the facilitator before it's published.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestPostDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPost}
              disabled={!requestContent.trim() || loading}
              className="brand-gradient text-white"
            >
              {loading ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}