// import React from 'react';
import PropTypes from 'prop-types';
import './TagContainer.css';
import Tag from '../tag/Tag';

function TagContainer({ tags, onTagClick, getTagState }) {
    return (
        <div className="filter-grid">
            <div className="filter-grid-content">
                {tags.map((tag, index) => (
                    <Tag
                        key={tag.name + index}
                        name={tag.name}
                        state={getTagState(tag.name)}
                        onClick={() => onTagClick(tag.name)}
                    />
                ))}
            </div>
        </div>
    );
}

TagContainer.propTypes = {
    tags: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
    })).isRequired,
    onTagClick: PropTypes.func.isRequired,
    getTagState: PropTypes.func.isRequired,
};

export default TagContainer; 