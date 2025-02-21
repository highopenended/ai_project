import PropTypes from 'prop-types';
import './BasicDetail.css';

const BasicDetail = ({ value, className = '' }) => {
    return (
        <div className={`basic-detail ${className}`}>
            {value || 'N/A'}
        </div>
    );
};

BasicDetail.propTypes = {
    value: PropTypes.string,
    className: PropTypes.string
};

export default BasicDetail; 