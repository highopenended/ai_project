import PropTypes from "prop-types";
import ShortDetailRow from './ShortDetailRow';
import ShortDetailContainer from './ShortDetailContainer';
import { useRef } from 'react';

const ShopDetailsShort = ({ shopDetails, onInputChange }) => {
    const shopNameRef = useRef(null);
    const shopKeeperNameRef = useRef(null);
    const typeRef = useRef(null);
    const locationRef = useRef(null);

    const handleEnterPress = (nextRef) => {
        if (nextRef.current) {
            nextRef.current.focus();
        }
    };

    return (
        <ShortDetailContainer>
            <ShortDetailRow
                ref={shopNameRef}
                title="Shop Name"                    
                value={shopDetails.shortData.shopName}
                onChange={onInputChange}
                name="shopName"
                onEnterPress={() => handleEnterPress(shopKeeperNameRef)}
                placeholder="Enter the shop's name"
            />
            <ShortDetailRow
                ref={shopKeeperNameRef}
                title="ShopKeeper"
                value={shopDetails.shortData.shopKeeperName}
                onChange={onInputChange}
                name="shopKeeperName"
                onEnterPress={() => handleEnterPress(typeRef)}
                placeholder="Enter the shopkeeper's name"
            />
            <ShortDetailRow
                ref={typeRef}
                title="Shop Type"
                value={shopDetails.shortData.type}
                onChange={onInputChange}
                name="type"
                onEnterPress={() => handleEnterPress(locationRef)}
                placeholder="Enter the type of shop"
            />
            <ShortDetailRow
                ref={locationRef}
                title="Location"
                value={shopDetails.shortData.location}
                onChange={onInputChange}
                name="location"
                onEnterPress={() => handleEnterPress(shopNameRef)}
                placeholder="Enter the shop's location"
            />
        </ShortDetailContainer>
    );
};

ShopDetailsShort.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired,
};

export default ShopDetailsShort;
