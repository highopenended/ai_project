import { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { deleteMultipleConversations, toggleConversationFavorite } from '../../../../lib/firebase/chatHistory';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ConversationPreview from './ConversationPreview';

/**
 * ConversationList Component
 * 
 * Displays and manages the list of conversations.
 * Handles conversation sorting, selection, and deletion.
 */
function ConversationList({ 
  conversations,
  sortBy,
  selectedId,
  isSelectionMode,
  selectedForDeletion,
  setSelectedForDeletion,
  onSelect,
  onRefresh,
  loading,
  error,
  setConversations
}) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

  const sortConversations = (convs) => {
    if (sortBy === 'favorite') {
      return [...convs].sort((a, b) => {
        if (a.favorite === b.favorite) {
          return b.lastAccessed - a.lastAccessed;
        }
        return b.favorite ? 1 : -1;
      });
    }
    return [...convs].sort((a, b) => b[sortBy] - a[sortBy]);
  };

  const handleSelectionChange = (conversation, index, event) => {
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
  };

  const handleDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) return;

    try {
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

      setSelectedForDeletion(new Set());
      await onRefresh();
    } catch (error) {
      console.error('Error deleting conversations:', error);
    }
  };

  const handleFavoriteToggle = async (conversation, event) => {
    event.stopPropagation();
    try {
        // Update UI immediately
        setConversations(prevConversations => 
            prevConversations.map(conv => 
                conv.id === conversation.id 
                    ? { ...conv, favorite: !conv.favorite }
                    : conv
            )
        );

        // Then sync with database
        await toggleConversationFavorite(currentUser.uid, conversation.id, !conversation.favorite);
    } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert UI on error
        setConversations(prevConversations => 
            prevConversations.map(conv => 
                conv.id === conversation.id 
                    ? { ...conv, favorite: conversation.favorite }
                    : conv
            )
        );
    }
  };

  const sortedConversations = sortConversations(conversations);

  if (loading) {
    return <div className="loading-state">Loading conversations...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  if (!sortedConversations || sortedConversations.length === 0) {
    return <div className="empty-state">No conversations yet</div>;
  }

  return (
    <div className="sidebar-content">
      {sortedConversations.map((conversation, index) => (
        conversation && (
          <ConversationPreview
            key={conversation.id}
            conversation={conversation}
            selected={selectedId === conversation.id}
            selectedForDeletion={selectedForDeletion.has(conversation.id)}
            isSelectionMode={isSelectionMode}
            onSelect={isSelectionMode ? handleSelectionChange : onSelect}
            onTitleEdit={onRefresh}
            index={index}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )
      ))}
    </div>
  );
}

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    messages: PropTypes.array.isRequired,
    createdAt: PropTypes.number.isRequired,
    lastAccessed: PropTypes.number.isRequired,
    favorite: PropTypes.bool
  })).isRequired,
  sortBy: PropTypes.string.isRequired,
  selectedId: PropTypes.string,
  isSelectionMode: PropTypes.bool.isRequired,
  selectedForDeletion: PropTypes.instanceOf(Set).isRequired,
  setSelectedForDeletion: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  setConversations: PropTypes.func.isRequired
};

export default ConversationList; 