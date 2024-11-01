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
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",  // Use the correct model name
                messages: [{ role: "user", content: question }],
                max_tokens: 500,
            });

            const answer = completion.choices[0].message.content.trim();
            res.json({ answer });
        } catch (error) {
            if (error.response) {
                console.error("OpenAI API Error:", error.response.status, error.response.data);
                res.status(error.response.status).json({ error: "OpenAI API Error", message: error.response.data });
            } else {
                console.error("Error:", error.message);
                res.status(500).json({ error: "An internal server error occurred", message: error.message });
            }
        }
    });
});
