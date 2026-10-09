import React, { useEffect, useState } from "react";
import axios from "./axios";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000"); // adjust backend URL if needed

function ProfilePopup({ userId, onClose, currentUserId }) {
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState("none");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/users/${userId}`);
        setProfile(res.data);

        const statusRes = await axios.get(`/follow/status/${currentUserId}/${userId}`);
        setIsFollowing(statusRes.data.isFollowing);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [userId, currentUserId]);

  // 🔔 Listen for real-time follow updates
  useEffect(() => {
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
    });

    return () => {
      socket.off("followUpdate");
    };
  }, [userId]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await axios.post("/follow/unfollow", {
          follower_id: currentUserId,
          following_id: userId,
        });
        setIsFollowing(false);
        setProfile((prev) => ({
          ...prev,
          followers_count: prev.followers_count - 1,
        }));
        socket.emit("unfollow", {
          followerId: currentUserId,
          followingId: userId,
          followerName: "You",
        });
      } else {
        await axios.post("/follow/follow", {
          follower_id: currentUserId,
          following_id: userId,
        });
        setIsFollowing(true);
        setProfile((prev) => ({
          ...prev,
          followers_count: prev.followers_count + 1,
        }));
        socket.emit("follow", {
          followerId: currentUserId,
          followingId: userId,
          followerName: "You",
        });
      }
    } catch (err) {
      console.error("Error updating follow:", err);
    }
  };

  const fetchLists = async (type) => {
    try {
      if (type === "followers") {
        const res = await axios.get(`/users/${userId}/followers`);
        setFollowers(res.data);
      } else {
        const res = await axios.get(`/users/${userId}/following`);
        setFollowing(res.data);
      }
      setTab(type);
    } catch (err) {
      console.error("Error fetching list:", err);
    }
  };

  if (!profile) return <div className="popup">Loading...</div>;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-border">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
            alt="avatar"
            className="avatar-img"
          />
        </div>
        <h3>{profile.username}</h3>
        <p>{profile.bio || "No bio yet."}</p>
        <p><strong>Joined:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>

        <div className="follow-stats">
          <span onClick={() => fetchLists("followers")} className="clickable">
            <strong>{profile.followers_count}</strong> Followers
          </span>
          <span onClick={() => fetchLists("following")} className="clickable">
            <strong>{profile.following_count}</strong> Following
          </span>
        </div>

        {tab === "followers" && (
          <div className="list-section">
            <h5>Followers</h5>
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
          <div className="list-section">
            <h5>Following</h5>
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

        <button className="follow-btn" onClick={toggleFollow}>
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default ProfilePopup;
