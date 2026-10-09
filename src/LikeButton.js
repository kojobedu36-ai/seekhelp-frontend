import React, { useState, useEffect } from "react";
import axios from "./axios";

function LikeButton({ userId, targetId, type }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchLikes = async () => {
      const res = await axios.get(`/likes/${type}/${targetId}`);
      setCount(parseInt(res.data.count, 10));
    };
    fetchLikes();
  }, [targetId, type]);

  const toggleLike = async () => {
    if (liked) {
      await axios.post(`/likes/${type}/unlike`, { user_id: userId, [`${type}_id`]: targetId });
      setLiked(false);
      setCount((c) => c - 1);
    } else {
      await axios.post(`/likes/${type}`, { user_id: userId, [`${type}_id`]: targetId });
      setLiked(true);
      setCount((c) => c + 1);
    }
  };

  return (
    <button onClick={toggleLike} style={{ marginTop: "5px" }}>
      {liked ? "💖 Unlike" : "🤍 Like"} ({count})
    </button>
  );
}

export default LikeButton;
