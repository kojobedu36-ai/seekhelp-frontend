import React, { useEffect, useState } from "react";
import axios from "./axios";
import "./App.css";

function FollowSuggestions({ userId }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(`/follow/suggest/${userId}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };
    fetchSuggestions();
  }, [userId]);

  return (
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
          <span className="mutuals">{s.mutuals} mutuals</span>
        </div>
      ))}
    </div>
  );
}

export default FollowSuggestions;
