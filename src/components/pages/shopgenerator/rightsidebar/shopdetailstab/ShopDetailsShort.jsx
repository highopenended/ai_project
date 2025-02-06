import PropTypes from 'prop-types';
import Section from '../../components/Section';
import Section_OneLine from '../../components/Section_OneLine';

const ShopDetailsShort = ({ shopDetails, isMultilineField, onInputChange }) => {
    const renderInputField = (key) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        return (
            <input
                type="text"
                name={key}
                placeholder={`Enter ${label.toLowerCase()}`}
                value={shopDetails[key]}
                onChange={onInputChange}
                aria-label={label}
            />
        );
    };

    return (
        <Section title="Basic Details">
            <div>
                {Object.keys(shopDetails)
                    .filter(key => !isMultilineField(key))
                    .map((key) => {
                        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                        return (
                            <Section_OneLine key={key} title={label}>
                                {renderInputField(key)}
                            </Section_OneLine>
                        );
                    })}
            </div>
        </Section>
    );
};

ShopDetailsShort.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    isMultilineField: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
};

export default ShopDetailsShort; 