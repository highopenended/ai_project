import PropTypes from "prop-types";
import "./Tab_ChooseShop.css";
import NewShopButton from "./newshopbutton/NewShopButton";
import SavedShopsList from "./savedshopslist/SavedShopsList";
import ImportExport from "./importexport/ImportExport";

/**
 * Tab_ChooseShop Component
 *
 * Manages the shop selection interface, including:
 * - Creating new shops
 * - Loading saved shops
 * - Importing/Exporting shop data
 */
function Tab_ChooseShop({ savedShops, onLoadShop, onNewShop, currentShopId }) {
    return (
        <div className="tab-choose-shop">
            <NewShopButton handleNewShop={onNewShop} />
            <SavedShopsList savedShops={savedShops} loadShop={onLoadShop} currentShopId={currentShopId} />
            <ImportExport handleImportShop={() => {}} handleExportShop={() => {}} shopData={{}} />
        </div>
    );
}

Tab_ChooseShop.propTypes = {
    savedShops: PropTypes.array.isRequired,
    onLoadShop: PropTypes.func.isRequired,
    onNewShop: PropTypes.func.isRequired,
    currentShopId: PropTypes.string,
};

Tab_ChooseShop.displayName = "Choose Shop";
Tab_ChooseShop.minWidth = 220;

export default Tab_ChooseShop;
