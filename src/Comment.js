import React, { useState, useEffect } from "react";
import axios from "./axios";
import LikeButton from "./LikeButton";
import ProfilePopup from "../../ProfilePopup";
import "./App.css";

function Comment({ comment, userId }) {
  const [replies, setReplies] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showProfile, setShowProfile] = useState(null);

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        const res = await axios.get(`/comments/${comment.comment_id}/replies`);
        setReplies(res.data);
      } catch (err) {
        console.error("Error fetching replies:", err);
      }
    };
    fetchReplies();
  }, [comment.comment_id]);

  const submitReply = async () => {
    if (!replyContent.trim()) return;
    try {
      const res = await axios.post("/posts/replyComment", {
        user_id: userId,
        comment_id: comment.comment_id,
        content: replyContent,
      });
      setReplies((prev) => [...prev, res.data]);
      setReplyContent("");
      setShowReplyForm(false);
    } catch (err) {
      console.error("Error submitting reply:", err);
    }
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div
          className="avatar-border"
          onClick={() => setShowProfile(comment.user_id)}
          title={`View ${comment.username}'s profile`}
        >
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`}
            alt="avatar"
            className="avatar-img"
          />
        </div>
        <div className="user-info">
          <strong>{comment.username || `User ${comment.user_id}`}</strong>
          {comment.followers_count !== undefined && (
            <span
              className="user-stats"
              title={`Followed by ${comment.mutuals || 0} people you know`}
            >
              {comment.followers_count} Followers
            </span>
          )}
        </div>
      </div>

      <p>{comment.content}</p>
      <small>{new Date(comment.created_at).toLocaleString()}</small>
      <div className="comment-actions">
        <LikeButton userId={userId} targetId={comment.comment_id} type="comment" />
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="reply-btn"
        >
          {showReplyForm ? "Cancel" : "Reply"}
        </button>
      </div>

      {showReplyForm && (
        <div className="reply-form">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="reply-input"
          />
          <button onClick={submitReply} className="submit-reply-btn">
            Submit Reply
          </button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="replies-list">
          <h5>Replies</h5>
          {replies.map((r) => (
            <div key={r.reply_id} className="reply-item">
              <div
                className="avatar-border"
                onClick={() => setShowProfile(r.user_id)}
                title={`View ${r.username}'s profile`}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.username}`}
                  alt="avatar"
                  className="avatar-img"
                />
              </div>
              <div className="user-info">
                <strong>{r.username || `User ${r.user_id}`}</strong>
                {r.followers_count !== undefined && (
                  <span
                    className="user-stats"
                    title={`Followed by ${r.mutuals || 0} people you know`}
                  >
                    {r.followers_count} Followers
                  </span>
                )}
              </div>
              <p>{r.content}</p>
              <small>{new Date(r.created_at).toLocaleString()}</small>
              <LikeButton userId={userId} targetId={r.reply_id} type="comment" />
            </div>
          ))}
        </div>
      )}

      {showProfile && (
        <ProfilePopup
          userId={showProfile}
          currentUserId={userId}
          onClose={() => setShowProfile(null)}
        />
      )}
    </div>
  );
}

export default Comment;
