import './ShopDetailsLong.css';
import PropTypes from 'prop-types';

const ShopDetailsLong = ({ shopDetails, onInputChange, placeholders }) => {
    return (
        <div className="long-detail-container">
            {Object.keys(shopDetails.longData).map((key) => (
                <div key={key} className="long-detail-block">
                    <div className="long-detail-header">
                        <span className="long-detail-title">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <textarea
                        className="long-detail-input"
                        name={key}
                        placeholder={placeholders[key] || `Enter ${key.toLowerCase()}`}
                        value={shopDetails.longData[key]}
                        onChange={onInputChange}
                        aria-label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    />
                </div>
            ))}
        </div>
    );
}

ShopDetailsLong.propTypes = {
    shopDetails: PropTypes.shape({
        longData: PropTypes.object.isRequired
    }).isRequired,
    onInputChange: PropTypes.func.isRequired,
    placeholders: PropTypes.object
};

ShopDetailsLong.defaultProps = {
    placeholders: {}
};

export default ShopDetailsLong; 