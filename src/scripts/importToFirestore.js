import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDocs, query, limit } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAfxOAYR_vLGR_y0OAVzFb-SHuya2D_sjE",
    authDomain: "project-dm-helper.firebaseapp.com",
    projectId: "project-dm-helper",
    storageBucket: "project-dm-helper.firebasestorage.app",
    messagingSenderId: "803001985782",
    appId: "1:803001985782:web:d233ad4ae12d83ab519ad7",
    measurementId: "G-RQYRM1GX9R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Deletes all documents in a collection
 * @param {string} collectionName - Name of the collection to clear
 */
export const deleteCollection = async (collectionName) => {
    try {
        const collectionRef = collection(db, collectionName);
        let documentsDeleted = 0;
        
        while (true) {
            // Get a batch of documents
            const q = query(collectionRef, limit(500));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                break;
            }
            
            // Delete documents in batches
            const batch = writeBatch(db);
            snapshot.docs.forEach((document) => {
                batch.delete(doc(db, collectionName, document.id));
                documentsDeleted++;
            });
            
            await batch.commit();
            console.log(`Deleted ${documentsDeleted} documents`);
        }
        
        console.log('Collection cleared successfully!');
        return true;
    } catch (error) {
        console.error('Error deleting collection:', error);
        throw error;
    }
};

/**
 * Imports data from a JSON file to a Firestore collection
 * @param {string} collectionName - Name of the collection to import to
 * @param {Array} jsonData - Array of objects to import
 * @param {number} batchSize - Number of documents to write in each batch (default: 500)
 * @param {boolean} clearExisting - Whether to delete existing documents before import (default: false)
 */
export const importJsonToFirestore = async (collectionName, jsonData, batchSize = 500, clearExisting = false) => {
    try {
        if (clearExisting) {
            console.log(`Clearing existing documents from ${collectionName}...`);
            await deleteCollection(collectionName);
        }

        const collectionRef = collection(db, collectionName);
        const totalDocuments = jsonData.length;
        let processedDocuments = 0;
        
        // Process the data in batches
        for (let i = 0; i < totalDocuments; i += batchSize) {
            const batch = writeBatch(db);
            const currentBatch = jsonData.slice(i, i + batchSize);
            
            currentBatch.forEach((item) => {
                const docRef = doc(collectionRef); // Auto-generate document ID
                batch.set(docRef, item);
            });
            
            await batch.commit();
            processedDocuments += currentBatch.length;
            console.log(`Processed ${processedDocuments}/${totalDocuments} documents`);
        }
        
        console.log('Import completed successfully!');
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
};

// Example usage:
// const jsonData = [{ field1: 'value1' }, { field2: 'value2' }];
// await importJsonToFirestore('myCollection', jsonData); 