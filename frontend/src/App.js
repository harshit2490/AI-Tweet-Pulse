import React, { useState } from "react";
import axios from "axios";
import "./styles.css";

function App() {
  const [topic, setTopic] = useState("");
  const [response, setResponse] = useState("");

  const handleAITweet = async (withImage = false) => {
    const endpoint = withImage ? "/tweet/ai-image" : "/tweet/ai";
    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, { topic });
      setResponse(res.data.message);
    } catch (error) {
      setResponse("Error posting tweet.");
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h1>🚀AI Tweet Pulse🚀</h1>
      <p>AI Tweet Generator...</p>
      <input
        type="text"
        placeholder="Enter topic (e.g., AI, startups, coding)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <button onClick={() => handleAITweet(false)}>Post AI Tweet</button>
      <button onClick={() => handleAITweet(true)}>Post AI Tweet with Image</button>
      <p>{response}</p>
    </div>
  );
}

export default App;
