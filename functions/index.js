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

exports.generateTitle = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        const { messages } = req.body;
        if (!messages || messages.length < 2) {
            return res.status(400).json({ error: "At least two messages are required" });
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Generate a concise, descriptive title (max 6 words) for this Pathfinder/D&D conversation. Create a thematic title that captures the essence of the tabletop RPG discussion. Examples:\n- For rules questions: 'Grappling Rules in Pathfinder 2E'\n- For character concepts: 'Unconventional Gnome Fighter Concept'\n- For worldbuilding: 'Mystical Kingdom of Kyonin Lore'\n- For session topics: 'Dungeon Master's Green Dragon Tactics'\nDo not use periods at the end. Focus on RPG themes and mechanics rather than quoting conversation text"
                    },
                    ...messages.slice(0, 4)
                ],
                max_tokens: 50,
                temperature: 0.7
            });

            const title = completion.choices[0].message.content.trim();
            res.json({ title });
        } catch (error) {
            console.error("Error generating title:", error);
            res.status(500).json({ error: "Failed to generate title" });
        }
    });
});

exports.chat = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        const { question } = req.body;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
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
