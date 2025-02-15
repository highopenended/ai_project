import PropTypes from 'prop-types';
import LongDetailsContainer from './LongDetailsContainer';
import LongDetailRow from './LongDetailRow';

const ShopDetailsLong = ({ 
    shopDetails, 
    onInputChange, 
    placeholders = {} 
}) => {
    return (
        <LongDetailsContainer>
            {Object.keys(shopDetails.longData).map((key) => (
                <LongDetailRow
                    key={key}
                    title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    value={shopDetails.longData[key]}
                    onChange={onInputChange}
                    name={key}
                    placeholder={placeholders[key] || `Enter ${key.toLowerCase()}`}
                />
            ))}
        </LongDetailsContainer>
    );
}

ShopDetailsLong.propTypes = {
    shopDetails: PropTypes.shape({
        longData: PropTypes.object.isRequired
    }).isRequired,
    onInputChange: PropTypes.func.isRequired,
    placeholders: PropTypes.object
};

export default ShopDetailsLong; 