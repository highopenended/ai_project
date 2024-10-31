const functions = require("firebase-functions");
const { Configuration, OpenAIApi } = require("openai");

// Initialize OpenAI with the API key stored in environment variables
const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY, // If you've set the key in environment variables
});
const openai = new OpenAIApi(configuration);

const { onRequest } = require("firebase-functions/v2/https");

exports.chat = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const { question } = req.body;

    try {
        const completion = await openai.createCompletion({
            model: "gpt-4-turbo", // or "text-davinci-003"
            prompt: question,
            max_tokens: 150,
        });

        const answer = completion.data.choices[0].text.trim();
        res.json({ answer });
    } catch (error) {
        console.error("Error communicating with OpenAI:", error);
        res.status(500).json({ error: "Error communicating with OpenAI" });
    }
});
