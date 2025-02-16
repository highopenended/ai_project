import PropTypes from 'prop-types';
import './ShopDates.css';

const ShopDates = ({ 
    dateCreated = new Date(), 
    dateLastEdited = new Date() 
}) => {
    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = date instanceof Date ? date : new Date(date);
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
    dateCreated: PropTypes.instanceOf(Date),
    dateLastEdited: PropTypes.instanceOf(Date)
};

export default ShopDates; 