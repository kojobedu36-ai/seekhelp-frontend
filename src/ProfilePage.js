import React, { useEffect, useState } from "react";
import axios from "./axios";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000"); // adjust backend URL if needed

function ProfilePage({ userId, currentUserId }) {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("posts");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      const res = await axios.get(`/users/${userId}/followers`);
      setFollowers(res.data);
      setTab("followers");
    } catch (err) {
      console.error("Error fetching followers:", err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await axios.get(`/users/${userId}/following`);
      setFollowing(res.data);
      setTab("following");
    } catch (err) {
      console.error("Error fetching following:", err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`/follow/suggest/${userId}`);
      setSuggestions(res.data.map(s => ({ ...s, isFollowing: false })));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [userId]);

  const toggleFollowSuggestion = async (targetId) => {
    try {
      setSuggestions(prev =>
        prev.map(s =>
          s.user_id === targetId
            ? { ...s, isFollowing: !s.isFollowing }
            : s
        )
      );

      const suggestion = suggestions.find(s => s.user_id === targetId);
      if (suggestion.isFollowing) {
        await axios.post("/follow/unfollow", {
          follower_id: currentUserId,
          following_id: targetId,
        });
        socket.emit("unfollow", {
          followerId: currentUserId,
          followingId: targetId,
          followerName: profile.username,
        });
      } else {
        await axios.post("/follow/follow", {
          follower_id: currentUserId,
          following_id: targetId,
        });
        socket.emit("follow", {
          followerId: currentUserId,
          followingId: targetId,
          followerName: profile.username,
        });
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  // 🔔 Real-time updates
  useEffect(() => {
    socket.emit("joinRoom", currentUserId);

    socket.on("followUpdate", (data) => {
      if (data.following_id === userId) {
        setProfile((prev) => ({
          ...prev,
          followers_count:
            data.action === "follow"
              ? prev.followers_count + 1
              : prev.followers_count - 1,
        }));
      }
      if (data.follower_id === userId) {
        setProfile((prev) => ({
          ...prev,
          following_count:
            data.action === "follow"
              ? prev.following_count + 1
              : prev.following_count - 1,
        }));
      }
      fetchSuggestions();
    });

    socket.on("newNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.off("followUpdate");
      socket.off("newNotification");
    };
  }, [userId, currentUserId]);

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-border">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
            alt="avatar"
            className="avatar-img"
          />
        </div>
        <h2>{profile.username}</h2>
        <p>{profile.bio || "No bio yet."}</p>
        <p><strong>Joined:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>

        <div className="follow-stats">
          <span onClick={fetchFollowers} className="clickable">
            <strong>{profile.followers_count}</strong> Followers
          </span>
          <span onClick={fetchFollowing} className="clickable">
            <strong>{profile.following_count}</strong> Following
          </span>
        </div>
      </div>

      <div className="profile-tabs">
        <button onClick={() => setTab("posts")} className={tab === "posts" ? "active" : ""}>
          Posts
        </button>
        <button onClick={fetchFollowers} className={tab === "followers" ? "active" : ""}>
          Followers
        </button>
        <button onClick={fetchFollowing} className={tab === "following" ? "active" : ""}>
          Following
        </button>
      </div>

      <div className="profile-content">
        {tab === "posts" && (
          <div>
            <h3>Posts</h3>
            {profile.posts.map((p) => (
              <div key={p.post_id} className="post-card">
                <p>{p.content}</p>
                <small>{new Date(p.created_at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}

        {tab === "followers" && (
          <div>
            <h3>Followers</h3>
            {followers.map((f) => (
              <div key={f.user_id} className="list-item">
                <div className="avatar-border">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`}
                    alt="avatar"
                    className="avatar-img"
                  />
                </div>
                <span>{f.username}</span>
                {f.mutuals !== undefined && f.mutuals > 0 && (
                  <span className="mutuals">Followed by {f.mutuals} people you know</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "following" && (
          <div>
            <h3>Following</h3>
            {following.map((f) => (
              <div key={f.user_id} className="list-item">
                <div className="avatar-border">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`}
                    alt="avatar"
                    className="avatar-img"
                  />
                </div>
                <span>{f.username}</span>
                {f.mutuals !== undefined && f.mutuals > 0 && (
                  <span className="mutuals">Followed by {f.mutuals} people you know</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="suggestions-card">
        <h4>People you may know</h4>
        {suggestions.map((s) => (
          <div key={s.user_id} className="suggestion-item">
            <div className="avatar-border">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.username}`}
                alt="avatar"
                className="avatar-img"
              />
            </div>
            <span>{s.username}</span>
            {s.mutuals !== undefined && s.mutuals > 0 && (
              <span className="mutuals">{s.mutuals} mutuals</span>
            )}
            <button
              className="follow-btn"
              onClick={() => toggleFollowSuggestion(s.user_id)}
            >
              {s.isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        ))}
      </div>

      <div className="notifications-card">
        <h4>Notifications</h4>
        {notifications.length === 0 ? (
          <p>No notifications yet</p>
        ) : (
          notifications.map((n, idx) => (
            <div key={idx} className="notif-item">
              <p>{n.message}</p>
              <small>{new Date().toLocaleTimeString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProfilePage;

