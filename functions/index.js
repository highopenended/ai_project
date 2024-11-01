const functions = require("firebase-functions");
const OpenAI = require("openai");

// Initialize OpenAI with the API key from Firebase functions config
const openai = new OpenAI({
    apiKey: functions.config().openai.key,
});

// Define the 1st Gen function
exports.chat = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const { question } = req.body;

    try {
        const completion = await openai.completions.create({
            model: "gpt-4o-mini",
            prompt: question,
            max_tokens: 150,
        });

        const answer = completion.choices[0].text.trim();
        res.json({ answer });
    } catch (error) {
        console.error("Error communicating with OpenAI:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});
