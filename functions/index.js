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
            console.error("Error communicating with OpenAI:", error);
            res.status(500).json({ error: "An error occurred" });
        }
    });
});
