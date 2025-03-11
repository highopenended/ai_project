import { db } from '../../../../firebaseConfig';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { debug } from '../../../../utils/debugUtils';

// Function to save or update shop data in Firebase
export async function saveOrUpdateShopData(userId, shopData) {
  debug('shopGenerator', 'Saving or updating shop data for user', userId);
  try {
    const shopsRef = collection(db, `users/${userId}/shops`);
    if (shopData.id) {
      const shopDoc = doc(shopsRef, shopData.id);
      await setDoc(shopDoc, shopData);
      debug('shopGenerator', 'Shop data updated with ID', shopData.id);
      return shopData.id;
    } else {
      const docRef = await addDoc(shopsRef, shopData);
      debug('shopGenerator', 'Shop data saved with ID', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    debug('shopGenerator', 'Error saving or updating shop data', error);
    throw error;
  }
}

// Function to load shop data from Firebase
export async function loadShopData(userId) {
  debug('shopGenerator', 'Loading shop data for user', userId);
  try {
    const shopsRef = collection(db, `users/${userId}/shops`);
    const querySnapshot = await getDocs(shopsRef);
    const shops = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return shops;
  } catch (error) {
    debug('shopGenerator', 'Error loading shop data', error);
    throw error;
  }
}

// Function to delete a shop from Firebase
export async function deleteShopData(userId, shopId) {
  try {
    const shopDoc = doc(db, `users/${userId}/shops`, shopId);
    await deleteDoc(shopDoc);
    debug('shopGenerator', 'Shop deleted with ID', shopId);
  } catch (error) {
    debug('shopGenerator', 'Error deleting shop', error);
    throw error;
  }
} 