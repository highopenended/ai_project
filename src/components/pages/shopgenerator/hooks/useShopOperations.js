import { deleteShopData, saveOrUpdateShopData } from "../utils/firebaseShopUtils";
import { takeShopSnapshot } from "../utils/shopStateUtils";

/**
 * Custom hook to handle shop operations like cloning, saving, and deleting
 */
export const useShopOperations = ({
    currentUser,
    shopDetails,
    setShopDetails,
    shopState,
    items,
    setShopSnapshot,
    loadShops
}) => {
    const handleCloneShop = () => {
        // Generate a new unique ID for the cloned shop
        const clonedShopId = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentDate = new Date();

        // Create new shop details with cloned data
        const clonedDetails = {
            ...shopDetails,
            id: clonedShopId,
            name: `${shopDetails.name} (Clone)`,
            dateCreated: currentDate,
            dateLastEdited: currentDate,
        };

        // Update shop details
        setShopDetails(clonedDetails);

        // Take a new snapshot with the cloned state
        const newSnapshot = takeShopSnapshot(
            clonedDetails,
            shopState,
            items
        );
        setShopSnapshot(newSnapshot);
    };

    const handleSaveShop = async () => {
        if (!currentUser) {
            alert("Please log in to save shops");
            return;
        }

        try {
            // Convert Map objects to a flat object structure for Firebase
            const filterStatesForStorage = {
                categories: Object.fromEntries(shopState.filters.categories.entries()),
                subcategories: Object.fromEntries(shopState.filters.subcategories.entries()),
                traits: Object.fromEntries(shopState.filters.traits.entries()),
            };

            const savedShopData = {
                id: shopDetails.id,
                name: shopDetails.name,
                keeperName: shopDetails.keeperName,
                type: shopDetails.type,
                location: shopDetails.location,
                description: shopDetails.description,
                keeperDescription: shopDetails.keeperDescription,
                gold: shopState.gold,
                levelRange: {
                    min: shopState.levelRange.min,
                    max: shopState.levelRange.max,
                },
                itemBias: shopState.itemBias,
                rarityDistribution: shopState.rarityDistribution,
                currentStock: items,
                dateCreated: shopDetails.dateCreated,
                dateLastEdited: shopDetails.dateLastEdited,
                filterStates: filterStatesForStorage,
            };

            console.log("Saving shop state:", savedShopData);
            const userId = currentUser.uid;
            const savedShopId = await saveOrUpdateShopData(userId, savedShopData);
            setShopDetails((prev) => ({ ...prev, id: savedShopId }));
            setShopDetails((prev) => ({ ...prev, dateLastEdited: new Date() }));
            
            // Take a new snapshot with the current state
            const newSnapshot = takeShopSnapshot(
                {
                    ...shopDetails,
                    id: savedShopId,
                    dateLastEdited: new Date()
                },
                shopState,
                items
            );
            setShopSnapshot(newSnapshot);
            
            // Reload the shops list after successful save
            await loadShops();
        } catch (error) {
            console.error("Error saving shop:", error);
            alert("Error saving shop. Please try again.");
        }
    };

    const handleDeleteShop = async () => {
        if (!currentUser || !shopDetails.id) {
            alert("Cannot delete shop. Please ensure you are logged in and have a valid shop selected.");
            return;
        }

        try {
            const userId = currentUser.uid;
            await deleteShopData(userId, shopDetails.id);
            alert("Shop deleted successfully!");
        } catch (error) {
            console.error("Error deleting shop:", error);
            alert("Error deleting shop. Please try again.");
        }
    };

    return {
        handleCloneShop,
        handleSaveShop,
        handleDeleteShop
    };
}; 