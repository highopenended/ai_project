import PropTypes from 'prop-types';

/**
 * HistoryHeader Component
 * 
 * Displays the header of the chat history sidebar with sorting and selection controls.
 */
function HistoryHeader({ 
  sortBy, 
  onSortChange, 
  isSelectionMode, 
  setIsSelectionMode, 
  selectedCount, 
  conversationCount,
  onDeleteSelected 
}) {
  return (
    <div className="sidebar-header">
      <div className="header-left">
        <span>Previous Conversations</span>
        <select 
          value={sortBy} 
          onChange={(e) => onSortChange(e.target.value)}
          className="sort-select"
          title="Sort conversations"
        >
          <option value="lastAccessed">Sort by Last Updated</option>
          <option value="createdAt">Sort by Creation Date</option>
          <option value="favorite">Sort by Favorites</option>
        </select>
      </div>
      <div className="header-actions">
        {isSelectionMode ? (
          <>
            <button 
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className="delete-button"
            >
              Delete ({selectedCount})
            </button>
            <button 
              onClick={() => setIsSelectionMode(false)}
              className="cancel-button"
            >
              Cancel
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsSelectionMode(true)}
            className="select-button"
            disabled={conversationCount === 0}
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}

HistoryHeader.propTypes = {
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  isSelectionMode: PropTypes.bool.isRequired,
  setIsSelectionMode: PropTypes.func.isRequired,
  selectedCount: PropTypes.number.isRequired,
  conversationCount: PropTypes.number.isRequired,
  onDeleteSelected: PropTypes.func.isRequired
};

export default HistoryHeader; 