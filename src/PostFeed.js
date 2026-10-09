import React, { useState, useEffect } from "react";
import axios from "./axios";
import socket from "./socket";
import Post from "../../Post";
import Comment from "../../Comment";
import "./App.css"; // bright CSS with animations

function PostFeed({ userId, target }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get("/posts");
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };
    fetchPosts();

    // Real-time listeners
    socket.on("newPost", (post) => {
      setPosts((prev) => [post, ...prev]);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    });

    socket.on("newComment", ({ post_id, comment }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === post_id
            ? { ...p, comments: [...(p.comments || []), comment] }
            : p
        )
      );
    });

    socket.on("newReply", ({ comment_id, reply }) => {
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          comments: p.comments.map((c) =>
            c.comment_id === comment_id
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c
          ),
        }))
      );
    });

    socket.on("newLike", ({ post_id, user_id }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === post_id
            ? { ...p, likes: [...(p.likes || []), user_id], heartAnimate: true }
            : p
        )
      );
      setTimeout(() => {
        setPosts((prev) =>
          prev.map((p) => ({ ...p, heartAnimate: false }))
        );
      }, 800);
    });

    socket.on("newLikeComment", ({ comment_id, user_id }) => {
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          comments: p.comments.map((c) =>
            c.comment_id === comment_id
              ? { ...c, likes: [...(c.likes || []), user_id] }
              : c
          ),
        }))
      );
    });

    return () => {
      socket.off("newPost");
      socket.off("newComment");
      socket.off("newReply");
      socket.off("newLike");
      socket.off("newLikeComment");
    };
  }, []);

  // 🔎 Handle navigation from notifications
  useEffect(() => {
    if (target && posts.length > 0) {
      const [type, id] = target.split("/").slice(1); // e.g. "posts/12"
      if (type === "posts") {
        const el = document.getElementById(`post-${id}`);
        if (el) {
          el.classList.add("highlight");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => el.classList.remove("highlight"), 2000);
        }
      } else if (type === "comments") {
        const el = document.getElementById(`comment-${id}`);
        if (el) {
          el.classList.add("highlight");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => el.classList.remove("highlight"), 2000);
        }
      }
    }
  }, [target, posts]);

  const submitPost = async () => {
    if (!newPost.trim()) return;
    try {
      await axios.post("/posts/create", {
        user_id: userId,
        content: newPost,
      });
      setNewPost("");
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  return (
    <div className={`feed-container ${animate ? "confetti" : ""}`}>
      <h2 className="feed-title">✨ Posts Feed</h2>
      <textarea
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        placeholder="What's on your mind?"
        className="post-input"
      />
      <button onClick={submitPost} className="post-btn">
        Post
      </button>

      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((p) => (
          <div key={p.post_id} id={`post-${p.post_id}`} className="post-card">
            <Post post={p} userId={userId} />
            {p.heartAnimate && <span className="heart-burst">❤️</span>}
            <h4 className="comment-title">Comments</h4>
            {p.comments && p.comments.length > 0 ? (
              p.comments.map((c) => (
                <div key={c.comment_id} id={`comment-${c.comment_id}`}>
                  <Comment comment={c} userId={userId} />
                </div>
              ))
            ) : (
              <p>No comments yet</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default PostFeed;
