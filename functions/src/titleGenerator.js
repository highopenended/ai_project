const { corsMiddleware, openai } = require('./config');

const SYSTEM_PROMPT = `Generate a concise, descriptive title (max 6 words) for this Pathfinder/D&D conversation. Create a thematic title that captures the essence of the tabletop RPG discussion. Examples:
- For rules questions: 'Grappling Rules in Pathfinder 2E'
- For character concepts: 'Unconventional Gnome Fighter Concept'
- For worldbuilding: 'Mystical Kingdom of Kyonin Lore'
- For session topics: 'Dungeon Master's Green Dragon Tactics'
Do not use periods at the end. Focus on RPG themes and mechanics rather than quoting conversation text`;

const generateTitle = async (req, res) => {
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
                    content: SYSTEM_PROMPT
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
};

const handleTitleGeneration = (req, res) => {
    corsMiddleware(req, res, () => generateTitle(req, res));
};

module.exports = handleTitleGeneration;