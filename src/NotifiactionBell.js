import React, { useState, useEffect } from "react";
import socket from "./socket"; 
import axios from "./axios";   

// Utility: relative time
function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Group notifications by type + source
function groupNotifications(notifications) {
  const grouped = {};
  notifications.forEach((n) => {
    const key = `${n.type}-${n.source_id}`;
    if (!grouped[key]) {
      grouped[key] = { ...n, actors: [n.actor_name] };
    } else {
      grouped[key].actors.push(n.actor_name);
    }
  });
  return Object.values(grouped);
}

// Format grouped notification text
function formatNotification(n) {
  const actors = n.actors.join(", ");
  switch (n.type) {
    case "like_post":
      return `${actors} liked your post • ${timeAgo(n.created_at)}`;
    case "comment_post":
      return `${actors} commented on your post • ${timeAgo(n.created_at)}`;
    case "like_comment":
      return `${actors} liked your comment • ${timeAgo(n.created_at)}`;
    case "reply_comment":
      return `${actors} replied to your comment • ${timeAgo(n.created_at)}`;
    case "message":
      return `New message from ${actors} • ${timeAgo(n.created_at)}`;
    default:
      return `Notification: ${n.type} • ${timeAgo(n.created_at)}`;
  }
}

function NotificationBell({ userId, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    socket.emit("joinRoom", userId);

    socket.on("receiveNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      // Show toast popup
      setToast(formatNotification({ ...notif, actors: [notif.actor_name] }));
      setTimeout(() => setToast(null), 4000);
    });

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`/notifications/${userId}`);
        setNotifications(res.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();

    return () => {
      socket.off("receiveNotification");
    };
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      await axios.post("/notifications/markRead", { notification_id: id });
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, read_status: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post("/notifications/markAllRead", { user_id: userId });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_status).length;
  const grouped = groupNotifications(notifications);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          position: "relative"
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            background: "red",
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "12px"
          }}>
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: "40px",
          right: 0,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          padding: "10px",
          width: "320px",
          maxHeight: "400px",
          overflowY: "auto",
          zIndex: 1000
        }}>
          {grouped.length === 0 ? (
            <p>No notifications</p>
          ) : (
            grouped.map((n) => (
              <div
                key={n.notification_id}
                style={{
                  marginBottom: "8px",
                  fontWeight: n.read_status ? "normal" : "bold",
                  padding: "6px",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer"
                }}
                onClick={() => {
                  markAsRead(n.notification_id);
                  if (onNavigate) onNavigate(n.type, n.source_id);
                }}
              >
                {formatNotification(n)}
                {!n.read_status && (
                  <button
                    style={{
                      marginLeft: "10px",
                      fontSize: "12px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      cursor: "pointer"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.notification_id);
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))
          )}
          {grouped.length > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                marginTop: "10px",
                width: "100%",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "6px",
                cursor: "pointer"
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      )}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#333",
          color: "white",
          padding: "10px 15px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 2000
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
