import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

/**
 * Loads saved shops from Firebase for a specific user
 * @param {string} userId - The ID of the current user
 * @returns {Promise<Array>} Array of saved shop objects
 * @throws {Error} If there's an error loading the shops
 */
export const loadSavedShops = async (userId) => {
    if (!userId) {
        console.log('No user authenticated, skipping load');
        return [];
    }

    try {
        console.log('Starting to load shops:', {
            uid: userId,
            path: `users/${userId}/shops`
        });

        const shopsRef = collection(db, `users/${userId}/shops`);
        console.log('Collection reference created');

        const shopsSnapshot = await getDocs(shopsRef);
        console.log('Got shops snapshot:', {
            empty: shopsSnapshot.empty,
            size: shopsSnapshot.size
        });

        const shops = [];
        shopsSnapshot.forEach((doc) => {
            shops.push({ id: doc.id, ...doc.data() });
        });

        console.log('Processed shops:', {
            count: shops.length,
            names: shops.map(s => s.name)
        });

        return shops;
    } catch (error) {
        console.error('Error loading shops:', {
            code: error.code,
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        throw error;
    }
}; 