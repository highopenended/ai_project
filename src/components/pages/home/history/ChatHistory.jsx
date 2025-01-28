import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getUserConversations, enforceConversationLimit } from '../../../../lib/firebase/chatHistory';
import { useNavigate, useLocation } from 'react-router-dom';
import HistoryHeader from './HistoryHeader';
import ConversationList from './ConversationList';
import './ChatHistory.css';

const CONVERSATION_LIMIT = 20;

/**
 * ChatHistory Component
 * 
 * Main container for the conversation history sidebar.
 * Manages the overall state and coordinates between child components.
 */
function ChatHistory() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());
  const [sortBy, setSortBy] = useState('lastAccessed');

  // Sort function moved to ConversationList component

  const loadConversations = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      await enforceConversationLimit(currentUser.uid, CONVERSATION_LIMIT);
      const userConversations = await getUserConversations(currentUser.uid);
      const validConversations = userConversations
        .filter(conv => conv && conv.messages && conv.title && conv.lastAccessed);
      setConversations(validConversations);

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
  }, [currentUser, location.state?.conversationId, location.state?.messages]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleConversationSelect = (conversation) => {
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
      <HistoryHeader 
        sortBy={sortBy}
        onSortChange={setSortBy}
        isSelectionMode={isSelectionMode}
        setIsSelectionMode={setIsSelectionMode}
        selectedCount={selectedForDeletion.size}
        conversationCount={conversations.length}
        onDeleteSelected={() => {
          // Will be implemented in ConversationList
          setSelectedForDeletion(new Set());
          setIsSelectionMode(false);
        }}
      />
      <ConversationList 
        conversations={conversations}
        sortBy={sortBy}
        selectedId={selectedId}
        isSelectionMode={isSelectionMode}
        selectedForDeletion={selectedForDeletion}
        setSelectedForDeletion={setSelectedForDeletion}
        onSelect={handleConversationSelect}
        onRefresh={loadConversations}
        loading={loading}
        error={error}
        setConversations={setConversations}
      />
    </div>
  );
}

export default ChatHistory; 