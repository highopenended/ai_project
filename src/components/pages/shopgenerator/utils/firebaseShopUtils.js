import { db } from '../../../../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Function to save shop data to Firebase
export async function saveShopData(userId, shopData) {
  try {
    const shopsRef = collection(db, `users/${userId}/shops`);
    const docRef = await addDoc(shopsRef, shopData);
    console.log('Shop data saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving shop data:', error);
    throw error;
  }
}

// Function to load shop data from Firebase
export async function loadShopData(userId) {
  try {
    const shopsRef = collection(db, `users/${userId}/shops`);
    const querySnapshot = await getDocs(shopsRef);
    const shops = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Loaded shop data:', shops);
    return shops;
  } catch (error) {
    console.error('Error loading shop data:', error);
    throw error;
  }
} 