import PropTypes from "prop-types";
import './ShortDetailRow.css';
import React from 'react';

const ShortDetailRow = React.forwardRef(({ title, value, onChange, name, onEnterPress, placeholder }, ref) => {
    // const inputRef = useRef(null);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            onEnterPress();
        }
    };

    return (
        <div className="short-detail-block">
            <span className="short-detail-title">{title}</span>
            <input
                ref={ref}
                className="short-detail-input"
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
            />
        </div>
    );
});

ShortDetailRow.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    onEnterPress: PropTypes.func.isRequired,
    placeholder: PropTypes.string.isRequired,
};

ShortDetailRow.displayName = 'ShortDetailRow';

export default ShortDetailRow; 