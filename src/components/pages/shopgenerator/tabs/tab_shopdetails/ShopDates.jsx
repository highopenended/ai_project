import PropTypes from 'prop-types';
import './ShopDates.css';

const ShopDates = ({ 
    dateCreated = null, 
    dateLastEdited = null 
}) => {
    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        // Check if date is valid before formatting
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="shop-dates-container">
            <div className="shop-date">
                <span className="date-label">Created:</span>
                <span className="date-value">{formatDate(dateCreated)}</span>
            </div>
            <div className="shop-date">
                <span className="date-label">Last Updated:</span>
                <span className="date-value">{formatDate(dateLastEdited)}</span>
            </div>
        </div>
    );
};

ShopDates.propTypes = {
    dateCreated: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
        PropTypes.object  // For Firebase Timestamp objects
    ]),
    dateLastEdited: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
        PropTypes.object  // For Firebase Timestamp objects
    ])
};

export default ShopDates; 