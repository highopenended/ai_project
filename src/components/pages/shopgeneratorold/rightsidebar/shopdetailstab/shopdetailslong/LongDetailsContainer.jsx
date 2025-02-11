import PropTypes from 'prop-types';
import './LongDetailsContainer.css';

const LongDetailsContainer = ({ children }) => {
    return (
        <div className="long-detail-container">
            {children}
        </div>
    );
};

LongDetailsContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

export default LongDetailsContainer; 