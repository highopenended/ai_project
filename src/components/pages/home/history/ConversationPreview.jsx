import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { updateConversationTitle } from '../../../../lib/firebase/chatHistory';
import PropTypes from 'prop-types';

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 50;

/**
 * ConversationPreview Component
 * 
 * Displays a single conversation entry in the history sidebar.
 * Handles title editing and favorite toggling for the conversation.
 */
function ConversationPreview({ 
  conversation, 
  selected, 
  selectedForDeletion,
  isSelectionMode,
  onSelect,
  onTitleEdit,
  onFavoriteToggle,
  index 
}) {
  const { currentUser } = useAuth();
  const [editingTitle, setEditingTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTitleEdit = (event) => {
    event.stopPropagation();
    setIsEditing(true);
    setEditingTitle(conversation.title || '');
  };

  const handleTitleChange = (e) => {
    if (e.target.value.length <= MAX_TITLE_LENGTH) {
      setEditingTitle(e.target.value);
    }
  };

  const handleTitleSave = async (event) => {
    event.preventDefault();
    const trimmedTitle = editingTitle.trim();
    
    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      handleTitleCancel(event);
      return;
    }
    
    try {
      await updateConversationTitle(currentUser.uid, conversation.id, trimmedTitle);
      await onTitleEdit(conversation);
    } catch (error) {
      console.error('Failed to update title:', error);
    }
    
    setIsEditing(false);
    setEditingTitle('');
  };

  const handleTitleCancel = (event) => {
    event.stopPropagation();
    setIsEditing(false);
    setEditingTitle('');
  };

  const handleFavoriteToggle = (event) => {
    event.stopPropagation();
    onFavoriteToggle(conversation, event);
  };

  const handleClick = (event) => {
    if (isSelectionMode) {
      onSelect(conversation, index, event);
    } else {
      onSelect(conversation);
    }
  };

  return (
    <div 
      className={`conversation-preview ${
        selected ? 'selected' : ''
      } ${selectedForDeletion ? 'selected-for-deletion' : ''}`}
      onClick={handleClick}
    >
      <div className="conversation-content">
        {isEditing ? (
          <form onSubmit={handleTitleSave} onClick={e => e.stopPropagation()}>
            <textarea
              ref={textareaRef}
              value={editingTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleCancel}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  handleTitleCancel(e);
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTitleSave(e);
                }
              }}
              autoFocus
              className="edit-title-input"
              maxLength={MAX_TITLE_LENGTH}
              placeholder={`Title (${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters)`}
            />
          </form>
        ) : (
          <>
            <h3 className="conversation-title">
              {conversation.title || 'Untitled Conversation'}
            </h3>
            <div className="conversation-timestamps">
              <p className="conversation-timestamp">
                Created: {new Date(conversation.createdAt).toLocaleDateString()}
              </p>
              <p className="conversation-timestamp">
                Last Updated: {new Date(conversation.lastAccessed).toLocaleDateString()}
              </p>
            </div>
          </>
        )}
      </div>
      {!isSelectionMode && (
        <div className="conversation-actions">
          <button
            onClick={handleFavoriteToggle}
            className={`favorite-button ${conversation.favorite ? 'favorited' : ''}`}
            title={conversation.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ★
          </button>
          <button
            onClick={handleTitleEdit}
            className="edit-title-button"
            title="Edit title"
          >
            ✎
          </button>
        </div>
      )}
    </div>
  );
}

ConversationPreview.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    createdAt: PropTypes.number.isRequired,
    lastAccessed: PropTypes.number.isRequired,
    favorite: PropTypes.bool
  }).isRequired,
  selected: PropTypes.bool.isRequired,
  selectedForDeletion: PropTypes.bool.isRequired,
  isSelectionMode: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onTitleEdit: PropTypes.func.isRequired,
  onFavoriteToggle: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired
};

export default ConversationPreview; 