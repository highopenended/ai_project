import PropTypes from "prop-types";
import Section from "../../../components/Section";
import Section_OneLine from "../../../components/Section_OneLine";
import ShortDetailRow from './ShortDetailRow';
import ShortDetailContainer from './ShortDetailContainer';

const ShopDetailsShort = ({ shopDetails, onInputChange }) => {

    const renderInputField = (key) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
        return (
            <input
                type="text"
                name={key}
                placeholder={`Enter ${label.toLowerCase()}`}
                value={shopDetails.shortData[key]}
                onChange={onInputChange}
                aria-label={label}
            />
        );
    };

    return (
        // <Section title="Basic Details">
            <ShortDetailContainer>
                <ShortDetailRow
                    title="Shop Name"
                    value={shopDetails.shortData.shopName}
                    onChange={onInputChange}
                    name="shopName"
                />
                <ShortDetailRow
                    title="ShopKeeper"
                    value={shopDetails.shortData.shopKeeperName}
                    onChange={onInputChange}
                    name="shopKeeperName"
                />
                <ShortDetailRow
                    title="Shop Type"
                    value={shopDetails.shortData.type}
                    onChange={onInputChange}
                    name="type"
                />
                <ShortDetailRow
                    title="Location"
                    value={shopDetails.shortData.location}
                    onChange={onInputChange}
                    name="location"
                />
            </ShortDetailContainer>
        // </Section>
    );
};

ShopDetailsShort.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired,
};

export default ShopDetailsShort;
