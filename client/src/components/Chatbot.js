import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConversationList from './ConversationList';
import './Chatbot.css';

const Chatbot = ({ user, onLogout }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Set up axios with auth token
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    withCredentials: true
  });

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation data when current conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadConversationData(currentConversation.id);
    } else {
      setMessages([]);
      setDocuments([]);
    }
  }, [currentConversation]);

  // Add debugging for button state
  useEffect(() => {
    console.log('Button state - loading:', loading, 'file:', file, 'disabled:', loading || !file);
  }, [loading, file]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await api.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        onLogout();
      }
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationData = async (conversationId) => {
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      setMessages(response.data.messages || []);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error loading conversation data:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        onLogout();
      }
    }
  };

  const handleFileChange = (e) => {
    console.log('handleFileChange called');
    console.log('Files:', e.target.files);
    console.log('Selected file:', e.target.files[0]);
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    console.log('handleUpload called');
    console.log('file:', file);
    console.log('currentConversation:', currentConversation);
    
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // If we have a current conversation, associate the file with it
    if (currentConversation) {
      formData.append('conversationId', currentConversation.id);
    }

    console.log('FormData created, sending request...');

    try {
      setLoading(true);
      console.log('Making API request to /upload');
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload response:', response.data);
      
      // If no current conversation, create one and select it
      if (!currentConversation) {
        const newConversation = {
          id: response.data.conversationId,
          title: `Chat about ${response.data.filename}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCurrentConversation(newConversation);
        setConversations(prev => [newConversation, ...prev]);
      } else {
        // Reload conversation data to show new document
        await loadConversationData(currentConversation.id);
      }
      
      setFile(null);
      setMessages(prev => [...prev, { role: 'system', content: `Document "${response.data.filename}" uploaded and ready to chat.` }]);
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        onLogout();
      } else {
        alert('Upload failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question || !currentConversation) return;
    
    setLoading(true);
    const userMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await api.post('/chat', { 
        question, 
        conversationId: currentConversation.id 
      });
      
      const assistantMessage = { role: 'assistant', content: response.data.answer };
      setMessages(prev => [...prev, assistantMessage]);
      setQuestion('');
      
      // Refresh conversations to update message count
      await loadConversations();
    } catch (error) {
      console.error('Chat error:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        onLogout();
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error fetching answer.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleNewConversation = (newConversation) => {
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
  };

  const handleDeleteConversation = (conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="chatbot-container">
      <div className="header">
        <h1>📄 GenAI Document Chatbot</h1>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="main-content">
        <ConversationList
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRefresh={loadConversations}
        />

        <div className="chat-area">
          {currentConversation ? (
            <>
              <div className="conversation-info">
                <h3>{currentConversation.title}</h3>
                {documents.length > 0 && (
                  <div className="documents-info">
                    <span>📁 {documents.length} document{documents.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="upload-section">
                <input type="file" accept=".pdf,.docx,.csv" onChange={handleFileChange} />
                <button 
                  onClick={(e) => {
                    console.log('Upload button clicked');
                    console.log('Button disabled:', loading || !file);
                    console.log('Event:', e);
                    handleUpload();
                  }} 
                  disabled={loading || !file}
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </div>

              <div className="chat-section">
                <div className="chat-box">
                  {messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`}>
                      <strong>{msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Bot'}:</strong> {msg.content}
                    </div>
                  ))}
                </div>
                <div className="input-section">
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  />
                  <button onClick={handleAsk} disabled={loading || !question.trim()}>
                    {loading ? 'Thinking...' : 'Ask'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <div className="welcome-message">
                <h2>Welcome to your RAG Chatbot!</h2>
                <p>Select a conversation from the sidebar or upload a document to get started.</p>
                <div className="upload-section">
                  <input type="file" accept=".pdf,.docx,.csv" onChange={handleFileChange} />
                  <button 
                    onClick={(e) => {
                      console.log('Welcome upload button clicked');
                      console.log('Button disabled:', loading || !file);
                      console.log('Event:', e);
                      handleUpload();
                    }} 
                    disabled={loading || !file}
                  >
                    {loading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 