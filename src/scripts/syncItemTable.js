import { readFileSync, writeFileSync } from 'fs';

// Paths relative to project root
const ROOT_JSON_PATH = 'item-table.json';
const PUBLIC_JSON_PATH = 'public/item-table.json';

function syncFiles() {
    try {
        // Read the public file as source of truth
        const publicData = readFileSync(PUBLIC_JSON_PATH, 'utf8');
        0
        // Parse and re-stringify to ensure proper formatting
        const items = JSON.parse(publicData);
        const formattedJson = JSON.stringify(items, null, 4);
        
        // Write to root directory
        writeFileSync(ROOT_JSON_PATH, formattedJson);
        
        console.log('✅ Successfully synced item-table.json files!');
        console.log(`📊 Total items: ${items.length}`);
    } catch (error) {
        console.error('❌ Error syncing files:', error.message);
        process.exit(1);
    }
}

// Run the sync
syncFiles(); 