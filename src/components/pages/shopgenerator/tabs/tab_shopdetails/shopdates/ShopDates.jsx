import PropTypes from 'prop-types';
import './ShopDates.css';

const ShopDates = ({ 
    dateCreated = new Date(), 
    dateLastEdited = new Date() 
}) => {
    const formatDate = (date) => {
        if (!date) return 'N/A';
        
        // Handle Firestore Timestamp objects
        if (date && typeof date.toDate === 'function') {
            date = date.toDate();
        }
        
        // Convert to Date object if it's a string or timestamp
        const d = date instanceof Date ? date : new Date(date);
        
        // Check if the date is valid
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
        PropTypes.instanceOf(Date),
        PropTypes.object, // For Firestore Timestamp objects
        PropTypes.string  // For date strings
    ]),
    dateLastEdited: PropTypes.oneOfType([
        PropTypes.instanceOf(Date),
        PropTypes.object, // For Firestore Timestamp objects
        PropTypes.string  // For date strings
    ])
};

export default ShopDates; 