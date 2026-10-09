import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import NotificationBell from "./NotificationBell";
import PostFeed from "./PostFeed";
import ChatWindow from "../../ChatWindow";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [welcome, setWelcome] = useState(false);
  const [target, setTarget] = useState(null); // 🔎 navigation target

  const handleNavigate = (type, sourceId) => {
    switch (type) {
      case "like_post":
      case "comment_post":
        setTarget(`/posts/${sourceId}`);
        break;
      case "like_comment":
      case "reply_comment":
        setTarget(`/comments/${sourceId}`);
        break;
      case "message":
        setPartnerId(sourceId); // open chat with this user
        break;
      case "follow":
        setTarget(`/profile/${sourceId}`);
        break;
      default:
        console.log("Unhandled notification type:", type, sourceId);
    }
  };

  const handleSetUser = (newUser) => {
    setUser(newUser);
    setWelcome(true);
    setTimeout(() => setWelcome(false), 3000);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="logo">🌟 SeekHelp</h1>
        {user && (
          <div className="user-info">
            <div className="avatar-border">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt="avatar"
                className="avatar-img"
              />
            </div>
            <NotificationBell userId={user.userId} onNavigate={handleNavigate} />
          </div>
        )}
      </header>

      {!user ? (
        <div className="auth-container">
          {showRegister ? (
            <RegisterForm setUser={handleSetUser} />
          ) : (
            <LoginForm setUser={handleSetUser} />
          )}
          <button className="toggle-btn" onClick={() => setShowRegister(!showRegister)}>
            {showRegister ? "Already have an account? Login" : "New user? Register"}
          </button>
        </div>
      ) : (
        <>
          {welcome && (
            <div className="welcome-banner">
              <span className="checkmark">✔</span> Welcome, {user.username}!
            </div>
          )}
          <main className="main-layout">
            <div className="feed-section">
              <PostFeed userId={user.userId} target={target} />
            </div>
            <div className="chat-section">
              {partnerId && <ChatWindow user={user} partnerId={partnerId} />}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
