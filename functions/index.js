const functions = require("firebase-functions/v1");
const OpenAI = require("openai");
const cors = require("cors")({ origin: true });

const openai = new OpenAI({
    apiKey: functions.config().openai.key,
});

exports.chat = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
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
            console.error("Error in function execution:", error);

            // Detailed error message for OpenAI API errors
            if (error.response) {
                console.error("OpenAI API Error:", error.response.status, error.response.data);
                res.status(500).json({ error: "Error with OpenAI API", details: error.response.data });
            } else {
                res.status(500).json({ error: "An internal server error occurred" });
            }
        }
    });
});
