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

/**
 * Formats the AI's suggested changes into a human-readable HTML format
 * 
 * @param {Object} suggestedChanges - The parsed JSON object containing AI suggestions
 * @returns {string} HTML formatted string representing the suggestions
 */
export const formatSuggestedChanges = (suggestedChanges) => {
    if (!suggestedChanges) return '';
    
    let formattedContent = '';
    
    // Add summary if available
    if (suggestedChanges.suggestionsSummary) {
        formattedContent += `<p class="suggestion-summary"><strong>Summary:</strong> ${suggestedChanges.suggestionsSummary}</p>`;
        formattedContent += '<hr />';
    }
    
    // Format basic information section
    const basicFields = [
        { key: 'name', label: 'Shop Name' },
        { key: 'type', label: 'Shop Type' },
        { key: 'keeperName', label: 'Keeper Name' },
        { key: 'location', label: 'Location' },
        { key: 'description', label: 'Shop Description' },
        { key: 'keeperDescription', label: 'Keeper Description' }
    ];
    
    const basicChanges = basicFields.filter(field => suggestedChanges[field.key] !== undefined);
    
    if (basicChanges.length > 0) {
        formattedContent += '<h4>Shop Details</h4><ul>';
        basicChanges.forEach(field => {
            formattedContent += `<li><strong>${field.label}:</strong> ${suggestedChanges[field.key]}</li>`;
        });
        formattedContent += '</ul>';
    }
    
    // Format parameters section
    const paramFields = [
        { key: 'gold', label: 'Gold Amount' },
        { key: 'levelRange', label: 'Level Range' },
        { key: 'itemBias', label: 'Item Bias' },
        { key: 'rarityDistribution', label: 'Rarity Distribution' }
    ];
    
    const paramChanges = paramFields.filter(field => suggestedChanges[field.key] !== undefined);
    
    if (paramChanges.length > 0) {
        formattedContent += '<h4>Shop Parameters</h4><ul>';
        paramChanges.forEach(field => {
            formattedContent += `<li><strong>${field.label}:</strong> ${formatParameterValue(field.key, suggestedChanges[field.key])}</li>`;
        });
        formattedContent += '</ul>';
    }
    
    // Format filter section if present
    if (suggestedChanges.filterCategories) {
        formattedContent += '<h4>Category Filters</h4><ul>';
        const filters = suggestedChanges.filterCategories;
        
        if (filters.included && filters.included.length > 0) {
            formattedContent += `<li><strong>Included Categories:</strong> ${filters.included.join(', ')}</li>`;
        }
        
        if (filters.excluded && filters.excluded.length > 0) {
            formattedContent += `<li><strong>Excluded Categories:</strong> ${filters.excluded.join(', ')}</li>`;
        }
        
        formattedContent += '</ul>';
    }
    
    return formattedContent;
};

/**
 * Formats parameter values based on their type
 * 
 * @param {string} field - The field key
 * @param {any} value - The value to format
 * @returns {string} Formatted value as a string
 */
const formatParameterValue = (field, value) => {
    let variety, cost;
    
    switch (field) {
        case 'gold':
            return `${value.toLocaleString()} gp`;
            
        case 'levelRange':
            return `${value.min} - ${value.max}`;
            
        case 'itemBias':
            // Handle different formats of itemBias
            if (typeof value === 'object') {
                if ('x' in value && 'y' in value) {
                    variety = value.x;
                    cost = value.y;
                } else if ('Variety' in value || 'variety' in value || 'Cost' in value || 'cost' in value) {
                    variety = value.Variety || value.variety || 0.5;
                    cost = value.Cost || value.cost || 0.5;
                }
            }
            
            return `Variety: ${Math.round(variety * 100)}%, Cost: ${Math.round(cost * 100)}%`;
            
        case 'rarityDistribution':
            return `Common: ${value.Common}%, Uncommon: ${value.Uncommon}%, Rare: ${value.Rare}%, Unique: ${value.Unique}%`;
            
        default:
            return JSON.stringify(value);
    }
};
