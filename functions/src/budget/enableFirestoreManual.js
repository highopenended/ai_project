const functions = require('firebase-functions/v1');
const { toggleFirestoreState } = require('./utils');

// HTTP trigger to manually enable Firestore
exports.enableFirestoreManually = functions.https.onRequest(async (req, res) => {
    try {
        await toggleFirestoreState('ENABLED');
        res.status(200).send('Firestore re-enabled successfully.');
    } catch (error) {
        res.status(500).send(`Error enabling Firestore: ${error.message}`);
    }
}); 