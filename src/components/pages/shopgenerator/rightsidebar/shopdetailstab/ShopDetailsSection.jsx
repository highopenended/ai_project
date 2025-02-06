import PropTypes from 'prop-types';
import Section from '../../components/Section';
import Section_OneLine from '../../components/Section_OneLine';

const ShopDetailsSection = ({ shopDetails, isMultilineField, onInputChange }) => {
    const renderInputField = (key) => {
        const isMultiline = isMultilineField(key);
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

        if (isMultiline) {
            return (
                <textarea
                    name={key}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    value={shopDetails[key]}
                    onChange={onInputChange}
                    aria-label={label}
                />
            );
        }

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
        <Section title="Shop Details">
            <div>
                {Object.keys(shopDetails).map((key) => {
                    const isMultiline = isMultilineField(key);
                    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

                    if (isMultiline) {
                        return (
                            <Section key={key} title={label}>
                                {renderInputField(key)}
                            </Section>
                        );
                    }

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

ShopDetailsSection.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    isMultilineField: PropTypes.func.isRequired,
    onInputChange: PropTypes.func.isRequired,
};

export default ShopDetailsSection; 