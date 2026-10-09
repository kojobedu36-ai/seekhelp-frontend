import React, { useState, useEffect, useRef } from "react";
import axios from "./axios";
import socket from "./socket";
import "./App.css";

function ChatWindow({ user, partnerId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [online, setOnline] = useState(false);
  const latestRef = useRef(null);

  // Load theme from localStorage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("chatTheme");
    if (savedTheme) return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem("chatTheme", theme); // save theme whenever it changes
  }, [theme]);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await axios.get(`/messages/conversation/${user.userId}/${partnerId}`);
        setMessages(res.data);

        res.data.forEach(async (m) => {
          if (m.receiver_id === user.userId && m.status !== "seen") {
            await axios.post("/messages/markSeen", { message_id: m.message_id });
          }
        });

        const seenRes = await axios.get(`/users/lastSeen/${partnerId}`);
        setLastSeen(seenRes.data.last_seen);
        setOnline(seenRes.data.online);
      } catch (err) {
        console.error("Error fetching conversation:", err);
      }
    };
    fetchConversation();

    socket.on("receiveMessage", (msg) => {
      if (
        (msg.sender_id === partnerId && msg.receiver_id === user.userId) ||
        (msg.sender_id === user.userId && msg.receiver_id === partnerId)
      ) {
        setMessages((prev) => [...prev, { ...msg, animate: true }]);
        setTimeout(() => {
          if (latestRef.current) {
            latestRef.current.classList.add("highlight");
            latestRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            setTimeout(() => latestRef.current.classList.remove("highlight"), 2000);
          }
        }, 100);
      }
    });

    socket.on("messageSeen", ({ message_id }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === message_id ? { ...m, status: "seen" } : m
        )
      );
    });

    socket.on("showTyping", ({ senderId }) => {
      if (senderId === partnerId) setTyping(true);
    });

    socket.on("hideTyping", ({ senderId }) => {
      if (senderId === partnerId) setTyping(false);
    });

    socket.on("updateLastSeen", ({ userId, time, online }) => {
      if (userId === partnerId) {
        setLastSeen(time);
        setOnline(online);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageSeen");
      socket.off("showTyping");
      socket.off("hideTyping");
      socket.off("updateLastSeen");
    };
  }, [user.userId, partnerId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      const res = await axios.post("/messages/send", {
        sender_id: user.userId,
        receiver_id: partnerId,
        content: input,
      });
      setMessages((prev) => [...prev, { ...res.data, animate: true }]);
      setInput("");
      socket.emit("stopTyping", { senderId: user.userId, receiverId: partnerId });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (e.target.value) {
      socket.emit("typing", { senderId: user.userId, receiverId: partnerId });
    } else {
      socket.emit("stopTyping", { senderId: user.userId, receiverId: partnerId });
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case "sent":
        return <span className="chat-status sent">📤 Sent</span>;
      case "delivered":
        return <span className="chat-status delivered">📬 Delivered</span>;
      case "seen":
        return <span className="chat-status seen pulse">👀 Seen</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`chat-container ${theme}-theme`}>
      {/* Theme toggle button */}
      <div className="theme-toggle">
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          Switch to {theme === "light" ? "Dark" : "Light"} Mode
        </button>
      </div>

      <h3 className="chat-title">
        💬 Chat with User {partnerId}
        {online ? (
          <span className="online-dot" title={`Last updated: ${new Date(lastSeen).toLocaleString()}`}>
            ● Online
          </span>
        ) : (
          lastSeen && (
            <span className="last-seen" title={`Exact time: ${new Date(lastSeen).toLocaleString()}`}>
              • Last seen {new Date(lastSeen).toLocaleString()}
            </span>
          )
        )}
      </h3>

      {typing && (
        <div className="typing-banner">
          <span className="online-dot">●</span> Partner is typing
          <span className="typing-dots"><span></span><span></span><span></span></span>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div
            key={m.message_id}
            ref={idx === messages.length - 1 ? latestRef : null}
            className={`chat-bubble ${m.sender_id === user.userId ? "you" : "partner"} ${m.animate ? "fade-in" : ""}`}
          >
            <strong>{m.sender_id === user.userId ? "You" : "Partner"}:</strong> {m.content}
            {m.sender_id === user.userId && renderStatus(m.status)}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="send-btn">Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;
