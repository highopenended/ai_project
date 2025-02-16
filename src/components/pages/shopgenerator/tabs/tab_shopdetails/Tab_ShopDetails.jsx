import PropTypes from 'prop-types';
import SaveShopButton from './saveshopbutton/SaveShopButton';
import CloneShopButton from './cloneshopbutton/CloneShopButton';
import ShopDates from './shopdates/ShopDates';
import ShopDetailsShort from './shopdetailsshort/ShopDetailsShort';
import ShopDetailsLong from './shopdetailslong/ShopDetailsLong';
import './Tab_ShopDetails.css';

/**
 * Tab_ShopDetails Component
 * 
 * Manages the shop details interface, including:
 * - Basic shop information (name, keeper, type, location)
 * - Extended shop details
 * - Shop dates (created, last edited)
 * - Save and clone functionality
 */
function Tab_ShopDetails({ currentShop, onShopDetailsChange, onSaveShop, onCloneShop }) {
    // Function to check if all shop details are filled
    const areAllDetailsFilled = () => {
        if (!currentShop) return false;
        const checkDataFilled = (data) => {
            return Object.values(data).every(value => value && typeof value === 'string' && value.trim() !== '');
        };
        return checkDataFilled(currentShop.shortData) && checkDataFilled(currentShop.longData);
    };

    return (
        <div className="tab-shop-details">
            <div className="shop-details-actions">
                <SaveShopButton
                    onSave={onSaveShop}
                    areAllDetailsFilled={areAllDetailsFilled}
                />
                <CloneShopButton
                    onClone={onCloneShop}
                    shopId={currentShop?.id}
                />
            </div>
            <div className="shop-details-content scrollable">
                <ShopDetailsShort 
                    shopDetails={currentShop} 
                    onInputChange={onShopDetailsChange}
                />
                <ShopDetailsLong 
                    shopDetails={currentShop} 
                    onInputChange={onShopDetailsChange}
                />
                <ShopDates
                    dateCreated={currentShop?.dateCreated}
                    dateLastEdited={currentShop?.dateLastEdited}
                />
            </div>
        </div>
    );
}

Tab_ShopDetails.propTypes = {
    currentShop: PropTypes.shape({
        id: PropTypes.string,
        shortData: PropTypes.shape({
            shopName: PropTypes.string.isRequired,
            shopKeeperName: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            location: PropTypes.string.isRequired
        }).isRequired,
        longData: PropTypes.shape({
            shopDetails: PropTypes.string.isRequired,
            shopKeeperDetails: PropTypes.string.isRequired
        }).isRequired,
        dateCreated: PropTypes.instanceOf(Date).isRequired,
        dateLastEdited: PropTypes.instanceOf(Date).isRequired
    }).isRequired,
    onShopDetailsChange: PropTypes.func.isRequired,
    onSaveShop: PropTypes.func.isRequired,
    onCloneShop: PropTypes.func.isRequired
};

Tab_ShopDetails.displayName = 'Shop Details';
Tab_ShopDetails.minWidth = 350;

export default Tab_ShopDetails;
