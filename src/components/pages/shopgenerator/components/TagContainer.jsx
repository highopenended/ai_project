// import React from 'react';
import PropTypes from 'prop-types';
import '../ShopGenerator.css';
import Tag from './Tag';



const TagContainer = ({ tags, onTagClick }) => {
    return (
        <div className="tag-container">
            {tags.map(tag => (
                <Tag 
                    key={tag.name}
                    name={tag.name}
                    state={tag.state}
                    onClick={() => onTagClick(tag.name)}
                />
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
    onTagClick: PropTypes.func.isRequired,
};

export default TagContainer; 