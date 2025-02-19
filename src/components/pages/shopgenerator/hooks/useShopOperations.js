import { deleteShopData, saveOrUpdateShopData } from "../utils/firebaseShopUtils";
import { takeShopSnapshot } from "../utils/shopStateUtils";

/**
 * Custom hook to handle shop operations like cloning, saving, and deleting
 */
export const useShopOperations = ({
    currentUser,
    shopState,
    setShopState,
    filters,
    items,
    setShopSnapshot,
    loadShops
}) => {
    const handleCloneShop = () => {
        // Generate a new unique ID for the cloned shop
        const clonedShopId = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentDate = new Date();

        // Create new shop state with cloned data
        const clonedState = {
            ...shopState,
            id: clonedShopId,
            name: `${shopState.name} (Clone)`,
            dateCreated: currentDate,
            dateLastEdited: currentDate,
        };

        // Update shop state
        setShopState(clonedState);

        // Take a new snapshot with the cloned state
        const newSnapshot = takeShopSnapshot(clonedState, filters, items);
        setShopSnapshot(newSnapshot);
    };

    const handleSaveShop = async () => {
        if (!currentUser) {
            alert("Please log in to save shops");
            return;
        }

        try {
            const currentDate = new Date();
            
            // Convert Map objects to a flat object structure for Firebase
            const filterStatesForStorage = {
                categories: Object.fromEntries(filters.categories.entries()),
                subcategories: Object.fromEntries(filters.subcategories.entries()),
                traits: Object.fromEntries(filters.traits.entries()),
            };

            const savedShopData = {
                ...shopState,
                dateLastEdited: currentDate,
                currentStock: items,
                filterStates: filterStatesForStorage,
            };

            console.log("Saving shop state:", savedShopData);
            const userId = currentUser.uid;
            const savedShopId = await saveOrUpdateShopData(userId, savedShopData);
            
            // Update shop state with new ID and last edited date
            const updatedState = {
                ...shopState,
                id: savedShopId,
                dateLastEdited: currentDate
            };
            setShopState(updatedState);
            
            // Take a new snapshot with the current state
            const newSnapshot = takeShopSnapshot(updatedState, filters, items);
            setShopSnapshot(newSnapshot);
            
            // Reload the shops list after successful save
            await loadShops();
        } catch (error) {
            console.error("Error saving shop:", error);
            alert("Error saving shop. Please try again.");
        }
    };

    const handleDeleteShop = async () => {
        if (!currentUser || !shopState.id) {
            alert("Cannot delete shop. Please ensure you are logged in and have a valid shop selected.");
            return;
        }

        try {
            const userId = currentUser.uid;
            await deleteShopData(userId, shopState.id);
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