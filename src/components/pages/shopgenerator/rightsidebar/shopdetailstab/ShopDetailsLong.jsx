import PropTypes from 'prop-types';
import Section from '../../components/Section';

const ShopDetailsLong = ({ shopDetails, onInputChange }) => {
    const renderInputField = (key) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        return (
            <textarea
                name={key}
                placeholder={`Enter ${label.toLowerCase()}`}
                value={shopDetails.longData[key]}
                onChange={onInputChange}
                aria-label={label}
            />
        );
    };

    return (
        <Section title="Detailed Description">
            <div>
                {Object.keys(shopDetails.longData).map((key) => {
                    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                    return (
                        <Section key={key} title={label}>
                            {renderInputField(key)}
                        </Section>
                    );
                })}
            </div>
        </Section>
    );
};

ShopDetailsLong.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired,
};

export default ShopDetailsLong; 