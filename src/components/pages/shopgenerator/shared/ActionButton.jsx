import PropTypes from 'prop-types';
import './ActionButton.css';

/**
 * ActionButton Component
 * 
 * A reusable button component with consistent styling and behavior.
 * Used as a base component for various action buttons in the shop generator.
 *
 * @component
 */
const ActionButton = ({ 
    onClick, 
    disabled = false, 
    icon, 
    text, 
    ariaLabel,
    title,
    customClassName = '',
    children
}) => {
    const baseClassName = 'action-button';
    const fullClassName = `${baseClassName} ${customClassName}`.trim();

    return (
        <button 
            className={fullClassName}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel || text}
            title={title}
        >
            {icon && <span className="action-icon">{icon}</span>}
            {text && <span className="action-text">{text}</span>}
            {children}
        </button>
    );
};

ActionButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    icon: PropTypes.node,
    text: PropTypes.string,
    ariaLabel: PropTypes.string,
    title: PropTypes.string,
    customClassName: PropTypes.string,
    children: PropTypes.node
};

export default ActionButton; 