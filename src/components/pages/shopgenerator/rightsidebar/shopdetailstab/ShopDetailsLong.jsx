import PropTypes from 'prop-types';
import LongDetailsContainer from './shopdetailslong/LongDetailsContainer';
import LongDetailRow from './shopdetailslong/LongDetailRow';

const ShopDetailsLong = ({ shopDetails, onInputChange }) => {
    return (
        <LongDetailsContainer>
            {Object.keys(shopDetails.longData).map((key) => (
                <LongDetailRow
                    key={key}
                    title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    value={shopDetails.longData[key]}
                    onChange={onInputChange}
                    name={key}
                    placeholder={`Enter ${key.toLowerCase()}`}
                />
            ))}
        </LongDetailsContainer>
    );
};

ShopDetailsLong.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired,
    placeholders: PropTypes.object
};

export default ShopDetailsLong; 