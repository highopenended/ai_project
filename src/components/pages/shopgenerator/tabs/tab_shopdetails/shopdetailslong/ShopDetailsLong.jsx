import PropTypes from 'prop-types';
import LongDetailsContainer from './LongDetailsContainer';
import LongDetailRow from './LongDetailRow';

const ShopDetailsLong = ({ 
    shopDetails, 
    onInputChange, 
    placeholders = {},
    isDisabled = false
}) => {
    const longDetails = {
        shopDetails: shopDetails.description,
        shopKeeperDetails: shopDetails.keeperDescription
    };

    return (
        <LongDetailsContainer>
            {Object.entries(longDetails).map(([key, value]) => (
                <LongDetailRow
                    key={key}
                    title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    value={value}
                    onChange={onInputChange}
                    name={key}
                    placeholder={placeholders[key] || `Enter ${key.toLowerCase()}`}
                    disabled={isDisabled}
                />
            ))}
        </LongDetailsContainer>
    );
}

ShopDetailsLong.propTypes = {
    shopDetails: PropTypes.shape({
        description: PropTypes.string.isRequired,
        keeperDescription: PropTypes.string.isRequired
    }).isRequired,
    onInputChange: PropTypes.func.isRequired,
    placeholders: PropTypes.object,
    isDisabled: PropTypes.bool
};

export default ShopDetailsLong; 