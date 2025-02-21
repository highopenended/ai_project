import PropTypes from "prop-types";
import SaveShopButton from "./saveshopbutton/SaveShopButton";
import CloneShopButton from "./cloneshopbutton/CloneShopButton";
import DeleteShopButton from "./deleteshopbutton/DeleteShopButton";
import ResetChangesButton from "./resetchangesbutton/ResetChangesButton";
import ShopDates from "./shopdates/ShopDates";
import ShopDetailsShort from "./shopdetailsshort/ShopDetailsShort";
import ShopDetailsLong from "./shopdetailslong/ShopDetailsLong";
import "./Tab_ShopDetails.css";

/**
 * Tab_ShopDetails Component
 *
 * Manages the shop details interface, including:
 * - Basic shop information (name, keeper, type, location)
 * - Extended shop details
 * - Shop dates (created, last edited)
 * - Save, clone, and delete functionality
 */
function Tab_ShopDetails({
    shopState,
    onShopDetailsChange,
    onSaveShop,
    onCloneShop,
    onDeleteShop,
    savedShops,
    hasUnsavedChanges,
    onRevertChanges,
    changes,
}) {
    // Function to check if all shop details are filled
    const areAllDetailsFilled = () => {
        if (!shopState) return false;
        return Object.values({
            name: shopState.name,
            keeperName: shopState.keeperName,
            type: shopState.type,
            location: shopState.location,
            description: shopState.description,
            keeperDescription: shopState.keeperDescription,
        }).every((value) => value && typeof value === "string" && value.trim() !== "");
    };

    // Check if the current shop exists in savedShops
    const isExistingShop = shopState?.id && savedShops?.some((shop) => shop.id === shopState.id);

    // Ensure boolean result
    const isNewUnsavedShop = Boolean(shopState?.id) && !isExistingShop;

    return (
        <div className="tab-shop-details">
            <div className="shop-details-actions">
                <SaveShopButton
                    onSaveShop={onSaveShop}
                    areAllDetailsFilled={areAllDetailsFilled}
                    shopName={shopState.name}
                    isNewUnsavedShop={isNewUnsavedShop}
                    hasUnsavedChanges={hasUnsavedChanges}
                    changes={changes}
                />
                <CloneShopButton
                    onClone={onCloneShop}
                    shopId={isNewUnsavedShop ? null : shopState?.id}
                    shopState={shopState}
                    hasUnsavedChanges={hasUnsavedChanges}
                    changes={changes}
                />
                <ResetChangesButton
                    onReset={onRevertChanges}
                    shopName={shopState.name}
                    hasUnsavedChanges={hasUnsavedChanges}
                    changes={changes}
                />
            </div>
            <div className="tab-shop-details scrollable">
                <ShopDetailsShort shopDetails={shopState} onInputChange={onShopDetailsChange} />
                <ShopDetailsLong shopDetails={shopState} onInputChange={onShopDetailsChange} />
                <ShopDates dateCreated={shopState?.dateCreated} dateLastEdited={shopState?.dateLastEdited} />

                <DeleteShopButton
                    onDelete={onDeleteShop}
                    shopId={isNewUnsavedShop ? null : shopState?.id}
                    shopState={shopState}
                />
            </div>
        </div>
    );
}

Tab_ShopDetails.propTypes = {
    shopState: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        keeperName: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        location: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        keeperDescription: PropTypes.string.isRequired,
        dateCreated: PropTypes.instanceOf(Date).isRequired,
        dateLastEdited: PropTypes.instanceOf(Date).isRequired,
        gold: PropTypes.number,
        levelRange: PropTypes.shape({
            min: PropTypes.number,
            max: PropTypes.number,
        }),
        itemBias: PropTypes.shape({
            x: PropTypes.number,
            y: PropTypes.number,
        }),
        rarityDistribution: PropTypes.object,
        currentStock: PropTypes.array,
        filterStorageObjects: PropTypes.object,
    }).isRequired,
    onShopDetailsChange: PropTypes.func.isRequired,
    onSaveShop: PropTypes.func.isRequired,
    onCloneShop: PropTypes.func.isRequired,
    onDeleteShop: PropTypes.func.isRequired,
    onRevertChanges: PropTypes.func.isRequired,
    savedShops: PropTypes.array.isRequired,
    hasUnsavedChanges: PropTypes.bool.isRequired,
    changes: PropTypes.shape({
        basic: PropTypes.object.isRequired,
        parameters: PropTypes.object.isRequired,
        hasInventoryChanged: PropTypes.bool.isRequired,
    }).isRequired,
};

Tab_ShopDetails.displayName = "Shop Details";
Tab_ShopDetails.minWidth = 350;

export default Tab_ShopDetails;
