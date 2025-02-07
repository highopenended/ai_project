// Function to encode shop data into a shareable code
export const encodeShopData = (shopData) => {
    console.log('Encoding shop data:', shopData);
    const dataToEncode = {
        // Shop details
        type: shopData.type,
        name: shopData.name,
        keeper: shopData.keeper,
        location: shopData.location,
        shopkeeperDescription: shopData.shopkeeperDescription,
        shopDetails: shopData.shopDetails,
        shopkeeperDetails: shopData.shopkeeperDetails,
        // Shop parameters
        goldAmount: shopData.goldAmount,
        levelRange: shopData.levelRange,
        shopBias: shopData.shopBias,
        rarityDistribution: shopData.rarityDistribution,
        // Categories and traits
        categories: shopData.categories,
        subcategories: shopData.subcategories,
        traits: shopData.traits,
        // Current stock
        currentStock: shopData.currentStock
    };
    console.log('Data being encoded:', dataToEncode);
    return btoa(JSON.stringify(dataToEncode));
};

// Function to decode shop data from a shareable code
export const decodeShopData = (code) => {
    try {
        const decodedData = JSON.parse(atob(code));
        console.log('Decoded shop data:', decodedData);
        return decodedData;
    } catch (error) {
        console.error('Error decoding shop data:', error);
        return null;
    }
}; 