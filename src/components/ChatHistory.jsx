import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserConversations, deleteMultipleConversations } from '../lib/firebase/chatHistory';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/ChatHistory.css';

/**
 * ChatHistory Component
 * 
 * Sidebar component that displays a list of user conversations.
 * Manages conversation selection and synchronizes with URL state.
 * 
 * Features:
 * - Loads and displays user conversations sorted by last access
 * - Handles conversation selection through URL state
 * - Updates selection when new conversations are created
 * - Provides loading and error states
 * 
 * State Management:
 * - Uses URL state for conversation selection
 * - Automatically refreshes when conversations are updated
 * - Selection is synchronized with the current route
 */
function ChatHistory() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

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

  const handleConversationClick = (conversation, index, event) => {
    if (isSelectionMode) {
      // Handle shift+click selection
      if (event.shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        
        setSelectedForDeletion(prev => {
          const newSet = new Set(prev);
          for (let i = start; i <= end; i++) {
            if (conversations[i]) {
              newSet.add(conversations[i].id);
            }
          }
          return newSet;
        });
      } else {
        // Regular selection toggle
        setSelectedForDeletion(prev => {
          const newSet = new Set(prev);
          if (newSet.has(conversation.id)) {
            newSet.delete(conversation.id);
          } else {
            newSet.add(conversation.id);
          }
          return newSet;
        });
        setLastSelectedIndex(index);
      }
    } else if (conversation && conversation.messages) {
      // Normal mode, navigate to conversation
      setSelectedId(conversation.id);
      navigate('/home', { 
        state: { 
          conversationId: conversation.id, 
          messages: conversation.messages 
        }
      });
    }
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    setLastSelectedIndex(null);
    setSelectedForDeletion(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setLastSelectedIndex(null);
    setSelectedForDeletion(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) return;

    try {
      setLoading(true);
      const ids = Array.from(selectedForDeletion);
      await deleteMultipleConversations(currentUser.uid, ids);
      
      // If current conversation is being deleted, clear it
      if (selectedForDeletion.has(selectedId)) {
        navigate('/home', { 
          replace: true, 
          state: { 
            messages: [], 
            conversationId: null 
          } 
        });
      }

      // Reset selection mode and refresh conversations
      setSelectedForDeletion(new Set());
      setIsSelectionMode(false);
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversations:', error);
      setError('Failed to delete conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleEdit = (conversation, event) => {
    event.stopPropagation();
    setEditingTitleId(conversation.id);
    setEditingTitle(conversation.title || '');
  };

  const handleTitleSave = async (event) => {
    event.preventDefault();
    // TODO: Implement save to Firebase
    setEditingTitleId(null);
    setEditingTitle('');
  };

  const handleTitleCancel = (event) => {
    event.stopPropagation();
    setEditingTitleId(null);
    setEditingTitle('');
  };

  return (
    <div className="chat-history">
      <div className="sidebar-header">
        <span>Previous Conversations</span>
        <div className="header-actions">
          {isSelectionMode ? (
            <>
              <button 
                onClick={handleDeleteSelected}
                disabled={selectedForDeletion.size === 0}
                className="delete-button"
              >
                Delete ({selectedForDeletion.size})
              </button>
              <button 
                onClick={exitSelectionMode}
                className="cancel-button"
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={enterSelectionMode}
              className="select-button"
              disabled={conversations.length === 0}
            >
              Select
            </button>
          )}
        </div>
      </div>
      <div className="sidebar-content">
        {loading && <div className="loading-state">Loading conversations...</div>}
        {error && <div className="error-state">{error}</div>}
        {!loading && !error && (!conversations || conversations.length === 0) ? (
          <div className="empty-state">No conversations yet</div>
        ) : (
          conversations.map((conversation, index) => (
            conversation && (
              <div 
                key={conversation.id}
                className={`conversation-preview ${
                  selectedId === conversation.id ? 'selected' : ''
                } ${selectedForDeletion.has(conversation.id) ? 'selected-for-deletion' : ''}`}
                onClick={(e) => handleConversationClick(conversation, index, e)}
              >
                <div className="conversation-content">
                  {editingTitleId === conversation.id ? (
                    <form onSubmit={handleTitleSave} onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            handleTitleCancel(e);
                          }
                        }}
                        autoFocus
                        className="edit-title-input"
                      />
                    </form>
                  ) : (
                    <h3 className="conversation-title">
                      {conversation.title || 'Untitled Conversation'}
                    </h3>
                  )}
                  <p className="conversation-timestamp">
                    {new Date(conversation.lastAccessed || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                {!isSelectionMode && (
                  <button
                    onClick={(e) => handleTitleEdit(conversation, e)}
                    className="edit-title-button"
                    title="Edit title"
                  >
                    ✎
                  </button>
                )}
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}

export default ChatHistory; 