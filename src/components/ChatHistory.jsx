import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserConversations } from '../lib/firebase/chatHistory';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ChatHistory.css';

function ChatHistory() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Function to load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      const userConversations = await getUserConversations(currentUser.uid);
      const validConversations = userConversations
        .filter(conv => conv && conv.messages && conv.title && conv.lastAccessed)
        // Sort conversations by lastAccessed timestamp, most recent first
        .sort((a, b) => b.lastAccessed - a.lastAccessed);
      setConversations(validConversations);

      // If we have a new conversation in the URL, select it
      const urlConversationId = location.state?.conversationId;
      if (urlConversationId) {
        setSelectedId(urlConversationId);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser, location.state?.conversationId]);

  // Load conversations initially and when URL changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleConversationClick = (conversation) => {
    if (conversation && conversation.messages) {
      setSelectedId(conversation.id);
      navigate('/home', { 
        state: { 
          conversationId: conversation.id, 
          messages: conversation.messages 
        }
      });
    }
  };

  return (
    <div className="chat-history">
      <div className="sidebar-header">Previous Conversations</div>
      <div className="sidebar-content">
        {loading && <div className="loading-state">Loading conversations...</div>}
        {error && <div className="error-state">{error}</div>}
        {!loading && !error && (!conversations || conversations.length === 0) ? (
          <div className="empty-state">No conversations yet</div>
        ) : (
          conversations.map((conversation) => (
            conversation && (
              <div 
                key={conversation.id}
                className={`conversation-preview ${
                  selectedId === conversation.id ? 'selected' : ''
                }`}
                onClick={() => handleConversationClick(conversation)}
              >
                <h3 className="conversation-title">
                  {conversation.title || 'Untitled Conversation'}
                </h3>
                <p className="conversation-timestamp">
                  {new Date(conversation.lastAccessed || Date.now()).toLocaleString()}
                </p>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}

export default ChatHistory; 