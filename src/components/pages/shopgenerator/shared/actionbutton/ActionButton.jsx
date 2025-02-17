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
    theme = '',
    customClassName = ''
}) => {
    const baseClassName = 'action-button';
    const themeClassName = theme ? `${theme}-theme` : '';
    const fullClassName = `${baseClassName} ${themeClassName} ${customClassName}`.trim();

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
    theme: PropTypes.oneOf(['', 'save', 'delete', 'clone', 'reset']),
    customClassName: PropTypes.string
};

export default ActionButton; 