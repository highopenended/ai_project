const admin = require('firebase-admin');

// Initialize admin only if it hasn't been initialized yet
if (!admin.apps.length) {
    admin.initializeApp();
}

async function toggleFirestoreState(state) {
    try {
        // Get the Security Rules instance
        const securityRules = admin.securityRules();
        
        // Define rules based on state
        const rules = state === 'DISABLED' 
            ? `rules_version = '2';
               service cloud.firestore {
                 match /databases/{database}/documents {
                   match /{document=**} {
                     allow read, write: if false; // Deny all access
                   }
                 }
               }`
            : `rules_version = '2';
               service cloud.firestore {
                 match /databases/{database}/documents {
                   // Allow access to item-table collection
                   match /item-table/{document=**} {
                     allow read, write: if true;
                   }
                   
                   match /users/{userId} {
                     // Allow users to read/write their own user document
                     allow read, write: if request.auth != null && request.auth.uid == userId;
                     
                     // Allow users to read/write their own conversations
                     match /conversations/{conversationId} {
                       allow read, write: if request.auth != null && request.auth.uid == userId;
                     }
               
                     // Allow users to read/write their own shops
                     match /shops/{shopId} {
                       allow read, write: if request.auth != null && request.auth.uid == userId;
                     }
                   }
                 }
               }`;

        // Update the security rules
        await securityRules.releaseFirestoreRulesetFromSource(rules);
        
        console.log(`Firestore ${state === 'DISABLED' ? 'disabled' : 'enabled'} successfully via security rules.`);
    } catch (err) {
        console.error(`Error setting Firestore state to ${state}:`, err);
        throw err;
    }
}

module.exports = {
    toggleFirestoreState
}; 