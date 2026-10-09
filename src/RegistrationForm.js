import React, { useState } from "react";
import axios from "./axios";
import "./App.css"; // import bright CSS with animations

function RegisterForm({ setUser }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confetti, setConfetti] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await axios.post("/auth/register", { username, email, password });
      setSuccess("Registration successful! Logging you in...");
      setError("");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2000);

      const loginRes = await axios.post("/auth/login", { email, password });
      const { token } = loginRes.data;
      localStorage.setItem("token", token);

      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ userId: payload.user_id, username: payload.username, token });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
      setSuccess("");
    }
  };

  return (
    <form onSubmit={handleRegister} className="register-form">
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      {confetti && <div className="confetti-burst">🎉🎊✨</div>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="signup-btn">Sign Up</button>
    </form>
  );
}

export default RegisterForm;
