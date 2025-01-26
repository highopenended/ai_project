const { functions } = require('./config');
const handleTitleGeneration = require('./titleGenerator');
const chatEndpoint = require('./chatHandler');

exports.generateTitle = functions.https.onRequest(handleTitleGeneration);
exports.chat = functions.https.onRequest(chatEndpoint); 