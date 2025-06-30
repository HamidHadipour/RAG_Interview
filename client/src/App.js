// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      setDocumentTitle(res.data.filename);
      setMessages([{ role: 'system', content: 'Document uploaded and ready to chat.' }]);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleAsk = async () => {
    if (!question) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    try {
      const res = await axios.post('http://localhost:5000/api/chat', { question });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
      setQuestion('');
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error fetching answer.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDocumentTitle('');
    setMessages([]);
    setQuestion('');
  };

  return (
    <div className="App">
      <h1>📄 GenAI Document Chatbot</h1>

      <div className="upload-section">
        <input type="file" accept=".pdf,.docx,.csv" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
        <button onClick={handleReset}>Reset</button>
      </div>

      {documentTitle && <p>📂 File: {documentTitle}</p>}

      <div className="chat-section">
        <div className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role}>
              <strong>{msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Bot'}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button onClick={handleAsk} disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </div>
    </div>
  );
}

export default App;
