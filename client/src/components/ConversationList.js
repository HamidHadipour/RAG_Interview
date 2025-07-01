import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ConversationList.css';

const ConversationList = ({ 
  conversations, 
  currentConversation, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation,
  onRefresh 
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNewConversation = async () => {
    if (!newTitle.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/conversations', 
        { title: newTitle.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewTitle('');
      onNewConversation(response.data);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    }
  };

  const handleEditConversation = async (conversationId, newTitle) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/conversations/${conversationId}`,
        { title: newTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingId(null);
      setEditTitle('');
      onRefresh();
    } catch (error) {
      console.error('Error updating conversation:', error);
      alert('Failed to update conversation');
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/conversations/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onDeleteConversation(conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="conversation-list">
      <div className="conversation-header">
        <h3>Conversations</h3>
        <button onClick={onRefresh} className="refresh-btn">🔄</button>
      </div>

      <div className="new-conversation">
        <input
          type="text"
          placeholder="New conversation title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNewConversation()}
        />
        <button onClick={handleNewConversation} disabled={!newTitle.trim()}>
          +
        </button>
      </div>

      <div className="conversations">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`conversation-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="conversation-content">
              {editingId === conversation.id ? (
                <div className="edit-conversation">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEditConversation(conversation.id, editTitle);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditTitle('');
                      }
                    }}
                    autoFocus
                  />
                  <button onClick={() => handleEditConversation(conversation.id, editTitle)}>✓</button>
                  <button onClick={() => {
                    setEditingId(null);
                    setEditTitle('');
                  }}>✗</button>
                </div>
              ) : (
                <>
                  <div className="conversation-title">{conversation.title}</div>
                  <div className="conversation-meta">
                    <span>{conversation.message_count || 0} messages</span>
                    <span>{formatDate(conversation.updated_at)}</span>
                  </div>
                </>
              )}
            </div>
            
            {editingId !== conversation.id && (
              <div className="conversation-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(conversation.id);
                    setEditTitle(conversation.title);
                  }}
                  className="edit-btn"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                  className="delete-btn"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {conversations.length === 0 && (
        <div className="no-conversations">
          <p>No conversations yet</p>
          <p>Upload a document to start chatting!</p>
        </div>
      )}
    </div>
  );
};

export default ConversationList; 