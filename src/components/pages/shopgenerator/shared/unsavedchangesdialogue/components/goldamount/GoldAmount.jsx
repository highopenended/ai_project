import PropTypes from 'prop-types';
import './GoldAmount.css';

const GoldAmount = ({ value, className = '' }) => {
    const formatGold = (amount) => {
        if (!amount && amount !== 0) return 'N/A';
        return `${amount.toLocaleString()} gp`;
    };

    return (
        <div className={`gold-amount ${className}`}>
            {formatGold(value)}
        </div>
    );
};

GoldAmount.propTypes = {
    value: PropTypes.number,
    className: PropTypes.string
};

export default GoldAmount; 