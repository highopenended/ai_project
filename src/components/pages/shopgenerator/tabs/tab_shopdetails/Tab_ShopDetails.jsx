import PropTypes from 'prop-types';
import SaveShopButton from './saveshopbutton/SaveShopButton';
import CloneShopButton from './cloneshopbutton/CloneShopButton';
import DeleteShopButton from './deleteshopbutton/DeleteShopButton';
import ResetChangesButton from './resetchangesbutton/ResetChangesButton';
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
 * - Save, clone, and delete functionality
 */
function Tab_ShopDetails({ currentShop, onShopDetailsChange, onSaveShop, onCloneShop, onDeleteShop, savedShops, hasUnsavedChanges, onResetChanges, changes }) {
    // Function to check if all shop details are filled
    const areAllDetailsFilled = () => {
        if (!currentShop) return false;
        const checkDataFilled = (data) => {
            return Object.values(data).every(value => value && typeof value === 'string' && value.trim() !== '');
        };
        return checkDataFilled(currentShop.shortData) && checkDataFilled(currentShop.longData);
    };

    // Check if the current shop exists in savedShops
    const isExistingShop = currentShop?.id && savedShops?.some(shop => shop.id === currentShop.id);

    return (
        <div className="tab-shop-details">
            <div className="shop-details-actions">
                <SaveShopButton
                    onSave={onSaveShop}
                    areAllDetailsFilled={areAllDetailsFilled}
                />
                {isExistingShop && (
                    <CloneShopButton
                        onClone={onCloneShop}
                        shopId={currentShop?.id}
                    />
                )}
            </div>
            <div className="tab-shop-details scrollable">
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
                {isExistingShop && (
                    <DeleteShopButton
                        onDelete={onDeleteShop}
                        shopId={currentShop?.id}
                        currentShop={currentShop}
                    />
                )}
                <ResetChangesButton
                    onReset={onResetChanges}
                    hasUnsavedChanges={hasUnsavedChanges}
                    currentShop={currentShop}
                    changes={changes}
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
    onCloneShop: PropTypes.func.isRequired,
    onDeleteShop: PropTypes.func.isRequired,
    onResetChanges: PropTypes.func.isRequired,
    savedShops: PropTypes.array.isRequired,
    hasUnsavedChanges: PropTypes.bool.isRequired,
    changes: PropTypes.shape({
        basic: PropTypes.object.isRequired,
        parameters: PropTypes.object.isRequired,
        hasInventoryChanged: PropTypes.bool.isRequired
    }).isRequired
};

Tab_ShopDetails.displayName = 'Shop Details';
Tab_ShopDetails.minWidth = 350;

export default Tab_ShopDetails;
