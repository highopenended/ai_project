import PropTypes from 'prop-types';

const ShopDetailsLong = ({ shopDetails, onInputChange }) => {
    return (
        <div className="long-detail-container">
            {Object.keys(shopDetails.longData).map((key) => (
                <div key={key} className="long-detail-block">
                    <span className="long-detail-title">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                    <textarea
                        className="long-detail-input"
                        name={key}
                        placeholder={`Enter ${key.toLowerCase()}`}
                        value={shopDetails.longData[key]}
                        onChange={onInputChange}
                        aria-label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    />
                </div>
            ))}
        </div>
    );
};

ShopDetailsLong.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired,
    placeholders: PropTypes.object
};


export default ShopDetailsLong; 