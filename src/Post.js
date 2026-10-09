import React, { useState, useEffect } from "react";
import axios from "./axios";
import LikeButton from "./seekhelp-frontend/src/LikeButton";
import ProfilePopup from "./ProfilePopup";
import "./App.css";

function Post({ post, userId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showProfile, setShowProfile] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`/posts/${post.post_id}/comments`);
        setComments(res.data);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };
    fetchComments();
  }, [post.post_id]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post("/posts/comment", {
        user_id: userId,
        post_id: post.post_id,
        content: newComment,
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div
          className="avatar-border"
          onClick={() => setShowProfile(post.user_id)}
          title={`View ${post.username}'s profile`}
        >
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
            alt="avatar"
            className="avatar-img"
          />
        </div>
        <div className="user-info">
          <strong>{post.username || `User ${post.user_id}`}</strong>
          {post.followers_count !== undefined && (
            <span
              className="user-stats"
              title={`Followed by ${post.mutuals || 0} people you know`}
            >
              {post.followers_count} Followers
            </span>
          )}
        </div>
      </div>

      <p>{post.content}</p>
      <small>{new Date(post.created_at).toLocaleString()}</small>
      <div className="post-actions">
        <LikeButton userId={userId} targetId={post.post_id} type="post" />
      </div>

      <div className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="comment-input"
        />
        <button onClick={submitComment} className="comment-btn">
          Comment
        </button>
      </div>

      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map((c) => (
            <div key={c.comment_id} className="comment-item">
              <div className="comment-header">
                <div
                  className="avatar-border"
                  onClick={() => setShowProfile(c.user_id)}
                  title={`View ${c.username}'s profile`}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`}
                    alt="avatar"
                    className="avatar-img"
                  />
                </div>
                <div className="user-info">
                  <strong>{c.username || `User ${c.user_id}`}</strong>
                  {c.followers_count !== undefined && (
                    <span
                      className="user-stats"
                      title={`Followed by ${c.mutuals || 0} people you know`}
                    >
                      {c.followers_count} Followers
                    </span>
                  )}
                </div>
              </div>
              <p>{c.content}</p>
              <small>{new Date(c.created_at).toLocaleString()}</small>
              <LikeButton userId={userId} targetId={c.comment_id} type="comment" />
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

export default Post;
