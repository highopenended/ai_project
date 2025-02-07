import PropTypes from "prop-types";
import './ShortDetailContainer.css';

const ShortDetailContainer = ({ children }) => {
    return (
        <div className="short-detail-container">
            {children}
        </div>
    );
};

ShortDetailContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ShortDetailContainer; 