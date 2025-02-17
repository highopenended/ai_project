import PropTypes from 'prop-types';
import './Scrollbar.css';

function Scrollbar({ children, style }) {
    return (
        <div style={style} className="scrollbar">
            {children}
        </div>
    );
}

Scrollbar.propTypes = {
    children: PropTypes.node.isRequired,
    style: PropTypes.object
};

export default Scrollbar; 