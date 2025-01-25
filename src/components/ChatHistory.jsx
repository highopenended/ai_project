import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserConversations } from '../lib/firebase/chatHistory';
import '../styles/ChatHistory.css';
import PropTypes from 'prop-types';

const ChatHistory = forwardRef(({ onSelectConversation, selectedId, refreshTrigger }, ref) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('ChatHistory rendering, currentUser:', currentUser); // Debug log

  // Function to load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      const userConversations = await getUserConversations(currentUser.uid);
      console.log('Loaded conversations:', userConversations);
      const validConversations = userConversations
        .filter(conv => conv && conv.messages && conv.title && conv.lastAccessed)
        // Sort conversations by lastAccessed timestamp, most recent first
        .sort((a, b) => b.lastAccessed - a.lastAccessed);
      setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load conversations when refreshTrigger changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations, refreshTrigger]);

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refresh: loadConversations
  }));

  const handleConversationClick = (conversation) => {
    console.log('Conversation clicked:', conversation); // Debug log
    if (conversation && conversation.messages) {
      onSelectConversation(conversation.messages, conversation.id);
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
});

ChatHistory.displayName = 'ChatHistory';

ChatHistory.propTypes = {
  onSelectConversation: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  refreshTrigger: PropTypes.number
};

export default ChatHistory; 