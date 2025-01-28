import { importJsonToFirestore, deleteCollection } from './importToFirestore.js';
import fs from 'fs';
import path from 'path';

const COLLECTION_NAME = 'item-table';  // Collection name
const JSON_FILENAME = 'item-table.json';  // Updated JSON filename
const ITEM_LIMIT = 20;  // Limit number of items to import

const runImport = async () => {
    try {
        const jsonPath = path.join(process.cwd(), JSON_FILENAME);
        const rawData = fs.readFileSync(jsonPath);
        const fullData = JSON.parse(rawData);
        
        // Take only the first 20 items
        const jsonData = fullData.slice(0, ITEM_LIMIT);
        console.log(`Importing first ${ITEM_LIMIT} items out of ${fullData.length} total items`);

        // Import with clearExisting set to true to overwrite existing data
        await importJsonToFirestore(COLLECTION_NAME, jsonData, 500, true);
        
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