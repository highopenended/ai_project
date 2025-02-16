const functions = require('firebase-functions/v1');
const { toggleFirestoreState } = require('./utils');

// Disable Firestore on budget exceed
exports.disableFirestoreOnBudget = functions.pubsub
    .topic('budget-alerts-firestore')
    .onPublish(async () => {
        await toggleFirestoreState('DISABLED');
    });

// Test endpoint to simulate budget exceeded (FOR TESTING ONLY)
exports.testDisableFirestore = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    
    try {
        await toggleFirestoreState('DISABLED');
        res.status(200).send('Firestore disabled successfully for testing.');
    } catch (error) {
        res.status(500).send(`Error disabling Firestore: ${error.message}`);
    }
}); 