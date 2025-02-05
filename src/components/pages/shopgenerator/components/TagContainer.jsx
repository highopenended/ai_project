// import React from 'react';
import PropTypes from 'prop-types';
import '../ShopGenerator.css';



const TagContainer = ({ tags, getTagClassName, onTagClick }) => {
    return (
        <div className="tag-container">
            {tags.map(tag => (
                <button
                    key={tag.name}
                    className={getTagClassName(tag.state)}
                    onClick={() => onTagClick(tag.name)}
                >
                    {tag.name}
                    <span className="count">({tag.count})</span>
                    {tag.state === 'EXCLUDE' && (
                        <span className="exclude-indicator">✕</span>
                    )}
                </button>
            ))}
        </div>
    );
};

TagContainer.propTypes = {
    tags: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        state: PropTypes.string.isRequired,
        count: PropTypes.number.isRequired,
    })).isRequired,
    getTagClassName: PropTypes.func.isRequired,
    onTagClick: PropTypes.func.isRequired,
};

export default TagContainer; 