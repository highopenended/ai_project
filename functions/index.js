const functions = require("firebase-functions");
const { Configuration, OpenAIApi } = require("openai"); // Import OpenAI

// Initialize OpenAI with the API key stored in Firebase environment variables
const configuration = new Configuration({
    apiKey: functions.config().openai.key,
});
const openai = new OpenAIApi(configuration);

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Define the chat function
exports.chat = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const { question } = req.body;

    try {
        const completion = await openai.createCompletion({
            model: "GPT-4o mini", // or another OpenAI model
            prompt: question,
            max_tokens: 150,
        });

        const answer = completion.data.choices[0].text.trim();
        res.json({ answer });
    } catch (error) {
        logger.error("Error communicating with OpenAI:", error);
        res.status(500).json({ error: "Error communicating with OpenAI" });
    }
});
