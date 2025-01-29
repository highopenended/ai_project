import { importJsonToFirestore, deleteCollection } from './importToFirestore.js';
import fs from 'fs';
import path from 'path';

const COLLECTION_NAME = 'item-table';  // Collection name
const JSON_FILENAME = 'item-table.json';  // Updated JSON filename

const runImport = async () => {
    try {
        const jsonPath = path.join(process.cwd(), JSON_FILENAME);
        const rawData = fs.readFileSync(jsonPath);
        const fullData = JSON.parse(rawData);
        
        // Format all the data
        const formattedData = fullData.map(item => ({
            ...item,
            bulk: item.bulk?.trim() === '' ? '-' : item.bulk, // Replace empty bulk with dash
            level: item.level ? Number(item.level) : 0 // Convert level to number, default to 0 if not present
        }));
        
        console.log(`Importing all ${formattedData.length} items to Firestore...`);
        
        // Import with clearExisting set to true to overwrite existing data
        await importJsonToFirestore(COLLECTION_NAME, formattedData, 500, true);
        
        console.log('Import process completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during import:', error);
        process.exit(1);
    }
};

const runDelete = async () => {
    try {
        await deleteCollection(COLLECTION_NAME);
        console.log('Delete process completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during delete:', error);
        process.exit(1);
    }
};

// Check command line arguments for the operation type
const operation = process.argv[2];
if (operation === 'delete') {
    runDelete();
} else if (operation === 'import') {
    runImport();
} else {
    console.error('Please specify operation: import or delete');
    process.exit(1);
} 