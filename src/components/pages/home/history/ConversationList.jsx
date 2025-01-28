import { useState } from 'react';
import PropTypes from 'prop-types';
import ConversationPreview from './ConversationPreview';

/**
 * ConversationList Component
 * 
 * Displays and manages the list of conversations.
 * Handles conversation sorting and selection.
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
  onFavoriteToggle
}) {
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
            onFavoriteToggle={onFavoriteToggle}
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
  onFavoriteToggle: PropTypes.func.isRequired
};

export default ConversationList; 