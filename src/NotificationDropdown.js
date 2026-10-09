import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function NotificationDropdown({ currentUserId, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    socket.emit("joinRoom", currentUserId);

    socket.on("receiveNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.off("receiveNotification");
    };
  }, [currentUserId]);

  const renderIcon = (type) => {
    switch (type) {
      case "like_post": return "❤️";
      case "comment_post": return "💬";
      case "like_comment": return "👍";
      case "reply_comment": return "↩️";
      case "message": return "✉️";
      case "follow": return "👤";
      default: return "🔔";
    }
  };

  const handleClick = (notif) => {
    switch (notif.type) {
      case "like_post":
      case "comment_post":
        onNavigate(`/posts/${notif.source_id}`);
        break;
      case "like_comment":
      case "reply_comment":
        onNavigate(`/comments/${notif.source_id}`);
        break;
      case "message":
        onNavigate(`/messages/${notif.triggered_by}`);
        break;
      case "follow":
        onNavigate(`/profile/${notif.triggered_by}`);
        break;
      default:
        console.log("Unhandled notification type:", notif.type);
    }
  };

  return (
    <div className="notification-wrapper">
      <button className="notif-btn" onClick={() => setOpen(!open)}>
        🔔 {notifications.length > 0 && <span className="notif-count">{notifications.length}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          {notifications.length === 0 ? (
            <p>No notifications yet</p>
          ) : (
            notifications.map((n, idx) => (
              <div key={idx} className="notif-item" onClick={() => handleClick(n)}>
                <span className="notif-icon">{renderIcon(n.type)}</span>
                <div className="notif-text">
                  <p>{n.actor_name ? `${n.actor_name} ${n.type.replace("_", " ")}` : n.message}</p>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
