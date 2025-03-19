import PropTypes from "prop-types";
import { useCallback } from "react";
import "./Tab_ChooseShop.css";
import NewShopButton from "./newshopbutton/NewShopButton";
import SavedShopsList from "./savedshopslist/SavedShopsList";
import ImportExport from "./importexport/ImportExport";
import { exportShopData } from "../../utils/shopFileUtils";

/**
 * Tab_ChooseShop Component
 *
 * Manages the shop selection interface, including:
 * - Creating new shops
 * - Loading saved shops
 * - Importing/Exporting shop data
 * - Bulk operations (deletion, export)
 */
function Tab_ChooseShop({ savedShops, onLoadShop, onNewShop, onDeleteShop, currentShopId, currentShopData, shopSnapshot }) {
    
    // Handle bulk deletion of shops
    const handleDeleteShops = useCallback((shopIds) => {
        if (shopIds && shopIds.length && onDeleteShop) {
            // Pass all shop IDs to be deleted at once
            onDeleteShop(shopIds);
        }
    }, [onDeleteShop]);
    
    // Handle bulk export of shops
    const handleExportShops = useCallback((shopsToExport) => {
        if (shopsToExport && shopsToExport.length) {
            // If only one shop, use normal export
            if (shopsToExport.length === 1) {
                exportShopData(shopsToExport[0]);
                return;
            }
            
            // Create a bundle with multiple shops
            const shopBundle = {
                bundleVersion: "1.0",
                bundleDate: new Date().toISOString(),
                shopCount: shopsToExport.length,
                shops: shopsToExport
            };
            
            // Export as a bundle file
            const fileName = `shop_bundle_${new Date().toISOString().slice(0,10)}.shops`;
            const json = JSON.stringify(shopBundle, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }
    }, []);
    
    return (
        <div className="tab-choose-shop">
            <NewShopButton handleNewShop={onNewShop} />
            <SavedShopsList 
                savedShops={savedShops} 
                loadShop={onLoadShop} 
                currentShopId={currentShopId}
                onDeleteShops={handleDeleteShops}
                onExportShops={handleExportShops} 
            />
            <ImportExport 
                handleImportShop={onLoadShop} 
                handleExportShop={exportShopData} 
                shopData={currentShopData}
                shopSnapshot={shopSnapshot}
            />
        </div>
    );
}

Tab_ChooseShop.propTypes = {
    savedShops: PropTypes.array.isRequired,
    onLoadShop: PropTypes.func.isRequired,
    onNewShop: PropTypes.func.isRequired,
    onDeleteShop: PropTypes.func,
    currentShopId: PropTypes.string,
    currentShopData: PropTypes.object.isRequired,
    shopSnapshot: PropTypes.object,
};

Tab_ChooseShop.displayName = "Choose Shop";
Tab_ChooseShop.minWidth = 220;

export default Tab_ChooseShop;
