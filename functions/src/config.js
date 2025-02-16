const functions = require("firebase-functions/v1");
const OpenAI = require("openai");
const cors = require("cors")({ 
    origin: true,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
});

const openai = new OpenAI({
    apiKey: functions.config().openai.key,
});

module.exports = {
    functions,
    openai,
    corsMiddleware: cors
}; 