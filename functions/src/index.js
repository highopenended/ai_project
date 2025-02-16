const functions = require('firebase-functions/v1');
const handleTitleGeneration = require('./titleGenerator');
const chatEndpoint = require('./chatHandler');
const { disableFirestoreOnBudget, testDisableFirestore } = require('./budget/disableFirestoreAutomatic');
const { enableFirestoreManually } = require('./budget/enableFirestoreManual');

exports.generateTitle = functions.https.onRequest(handleTitleGeneration);
exports.chat = functions.https.onRequest(chatEndpoint);
exports.disableFirestoreOnBudget = disableFirestoreOnBudget;
exports.enableFirestoreManually = enableFirestoreManually;
exports.testDisableFirestore = testDisableFirestore; // FOR TESTING ONLY 