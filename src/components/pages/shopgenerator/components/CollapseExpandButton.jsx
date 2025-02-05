import PropTypes from 'prop-types';

function CollapseExpandButton({ isCollapsed, toggleCollapse }) {
    return (
        <button
            className={`collapse-button ${isCollapsed ? 'collapsed' : ''}`}
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
            </svg>
        </button>
    );
}

CollapseExpandButton.propTypes = {
    isCollapsed: PropTypes.bool.isRequired,
    toggleCollapse: PropTypes.func.isRequired,
};

export default CollapseExpandButton; 