import PropTypes from 'prop-types';
import Section from '../components/Section';

const ShopDetailsSection = ({ shopDetails, renderInputField }) => {
    return (
        <Section title="Shop Details">
            <div className="shop-details">
                {Object.keys(shopDetails).map((key) => (
                    <div key={key} className="detail-section">
                        {renderInputField(key)}
                    </div>
                ))}
            </div>
        </Section>
    );
};

ShopDetailsSection.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    renderInputField: PropTypes.func.isRequired,
};

export default ShopDetailsSection; 