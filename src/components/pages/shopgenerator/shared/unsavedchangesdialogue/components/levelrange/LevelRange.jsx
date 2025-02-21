import PropTypes from 'prop-types';
import './LevelRange.css';

const LevelRange = ({ min, max, className = '' }) => {
    const formatRange = () => {
        if ((min === undefined || min === null) && (max === undefined || max === null)) {
            return 'N/A';
        }
        return `Level ${min || 0} - ${max || 0}`;
    };

    return (
        <div className={`level-range ${className}`}>
            {formatRange()}
        </div>
    );
};

LevelRange.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    className: PropTypes.string
};

export default LevelRange; 