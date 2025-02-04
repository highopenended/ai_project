import PropTypes from 'prop-types';
import './MiddleBar.css';

function MiddleBar({ children }) {
    return (
        <div className="middle-bar">
            {children}
        </div>
    );
}

MiddleBar.propTypes = {
    children: PropTypes.node.isRequired
};

export default MiddleBar;
