import PropTypes from "prop-types";
import ShortDetailRow from './ShortDetailRow';
import ShortDetailContainer from './ShortDetailContainer';
import { useRef, useCallback } from 'react';

const ShopDetailsShort = ({ shopDetails, onInputChange, isDisabled = false }) => {
    const shopNameRef = useRef(null);
    const shopKeeperNameRef = useRef(null);
    const typeRef = useRef(null);
    const locationRef = useRef(null);

    const handleEnterPress = (nextRef) => {
        if (nextRef.current) {
            nextRef.current.focus();
        }
    };

    const handleChange = useCallback((e) => {
        onInputChange(e);
    }, [onInputChange]);

    return (
        <ShortDetailContainer>
            <ShortDetailRow
                ref={shopNameRef}
                title="Shop Name"                    
                value={shopDetails.name}
                onChange={handleChange}
                name="shopName"
                onEnterPress={() => handleEnterPress(shopKeeperNameRef)}
                placeholder="Enter the shop's name"
                disabled={isDisabled}
            />
            <ShortDetailRow
                ref={shopKeeperNameRef}
                title="ShopKeeper"
                value={shopDetails.keeperName}
                onChange={handleChange}
                name="shopKeeperName"
                onEnterPress={() => handleEnterPress(typeRef)}
                placeholder="Enter the shopkeeper's name"
                disabled={isDisabled}
            />
            <ShortDetailRow
                ref={typeRef}
                title="Shop Type"
                value={shopDetails.type}
                onChange={handleChange}
                name="type"
                onEnterPress={() => handleEnterPress(locationRef)}
                placeholder="Enter the type of shop"
                disabled={isDisabled}
            />
            <ShortDetailRow
                ref={locationRef}
                title="Location"
                value={shopDetails.location}
                onChange={handleChange}
                name="location"
                onEnterPress={() => handleEnterPress(shopNameRef)}
                placeholder="Enter the shop's location"
                disabled={isDisabled}
            />
        </ShortDetailContainer>
    );
};

ShopDetailsShort.propTypes = {
    shopDetails: PropTypes.object.isRequired,
    onInputChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool
};

export default ShopDetailsShort;
