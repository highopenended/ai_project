import { encodeShopData, decodeShopData } from './shopDataUtils';

/**
 * Exports shop data to a downloadable file
 * @param {Object} shopData - The complete shop data to export
 * @param {string} shopName - The name of the shop (used for filename)
 * @returns {Promise<void>}
 */
export const exportShop = async (shopData) => {
    try {
        const exportCode = encodeShopData(shopData);
        const blob = new Blob([exportCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${shopData.name || 'shop'}.shop`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Error exporting shop:', error);
        throw new Error('Failed to export shop');
    }
};

/**
 * Imports shop data from a file
 * @param {File} file - The file object containing shop data
 * @returns {Promise<Object>} The imported shop data
 */
export const importShop = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = decodeShopData(e.target.result);
                if (!importedData) {
                    reject(new Error('Invalid shop file'));
                    return;
                }
                resolve(importedData);
            } catch (error) {
                console.error('Error importing shop:', error);
                reject(new Error('Failed to import shop'));
            }
        };

        reader.readAsText(file);
    });
}; 