const OpenAI = require("openai");

// Initialize OpenAI with the API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY, // This is the default, so it can be omitted if the env variable is set
});

const { onRequest } = require("firebase-functions/v2/https");

exports.chat = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const { question } = req.body;
    
    try {
        const completion = await openai.completions.create({
            model: "gpt-4-turbo", // or "text-davinci-003"
            prompt: question,
            max_tokens: 150,
        });

        const answer = completion.choices[0].text.trim();
        res.json({ answer });
    } catch (error) {
        if (error instanceof OpenAI.APIError) {
            console.error("OpenAI API Error:", error.status, error.message, error.code, error.type);
            res.status(error.status).json({ error: error.message });
        } else {
            // Non-API error
            console.error("General Error:", error);
            res.status(500).json({ error: "An unexpected error occurred" });
        }
    }
});
