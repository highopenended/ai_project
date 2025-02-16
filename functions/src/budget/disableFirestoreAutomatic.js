const functions = require('firebase-functions/v1');
const { toggleFirestoreState } = require('./utils');

// Disable Firestore on budget exceed
exports.disableFirestoreOnBudget = functions.pubsub
    .topic('your-topic-id')
    .onPublish(async () => {
        await toggleFirestoreState('DISABLED');
    }); 