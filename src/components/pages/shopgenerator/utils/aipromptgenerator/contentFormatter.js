/**
 * Formats message content with markdown-like syntax for the AI assistant chat interface.
 * Converts various markdown patterns into HTML elements for rendering.
 * 
 * @param {string} text - The text content to format
 * @param {string} role - The role of the message sender ('user' or 'assistant')
 * @returns {string} HTML formatted string
 */
export const formatContent = (text, role) => {
    // Return empty string for undefined/null content
    if (!text) return '';

    if (role === "user") return text;

    return (
        text
            // First, handle headers
            .replace(/^### (.*?)$/gm, "<h3>$1</h3>")

            // Handle section headers (bold text at start of line)
            .replace(/^\*\*(.*?)\*\*$/gm, "<h4>$1</h4>")

            // Handle numbered items with bold
            .replace(
                /^(\d+)\.\s+\*\*(.*?)\*\*(.*)$/gm,
                '<div class="numbered-item"><span class="number">$1.</span> <strong>$2</strong>$3</div>'
            )

            // Handle decimal numbered items (like 4.1, 4.2) - convert to bullet points with indentation
            .replace(/^(\d+)\.(\d+)\.\s+(.*?)$/gm, '<ul class="sub-list"><li><strong>$1.$2</strong> $3</li></ul>')

            // Handle regular numbered items
            .replace(/^(\d+)\.\s+(.*?)$/gm, '<div class="numbered-item"><span class="number">$1.</span> $2</div>')

            // Handle bullet points
            .replace(/^[-*]\s+(.*?)$/gm, "<ul><li>$1</li></ul>")

            // Handle bold text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

            // Handle paragraphs (lines that don't match any of the above)
            .replace(/^(?!<[hud]|<strong|<div|$)(.*?)$/gm, "<p>$1</p>")

            // Handle horizontal rules
            .replace(/^---+$/gm, "<hr />")

            // Handle subseparators
            .replace(/^===+$/gm, '<div class="subseparator"></div>')

            // Clean up extra newlines
            .replace(/\n{3,}/g, "\n\n")
            .trim()
    );
};
