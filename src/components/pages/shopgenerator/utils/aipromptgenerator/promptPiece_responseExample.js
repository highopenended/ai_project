/**
 * AI Response Formatter
 * 
 * This module handles the structured format for AI responses specifically for the
 * Improvement Dialog flow. It provides utilities for generating structured prompts
 * and parsing AI responses into a format that can be directly mapped to shop state.
 */

/**
 * Generates the format specification part of the prompt based on fields to improve
 * @param {Array} promptPiece_unpreservedFields - List of fields that need suggestions
 * @returns {string} Format specification text for the prompt
 */
export const getPiece_responseExample = (promptPiece_unpreservedFields) => {
    const fieldSpecs = promptPiece_unpreservedFields.map(field => {
        const spec = getFieldSpecification(field);
        return `  "${field}": ${spec.description} (${spec.type})`;
    }).join('\n');

    return `Please provide your suggestions in the following JSON format:

{
  "suggestionsSummary": "A brief overview of all suggested changes",
${fieldSpecs}
}

Your response should be valid JSON that can be parsed directly. Numbers should be provided as actual numbers, not strings.
Boolean values should be true or false, not strings. Arrays should be proper JSON arrays.

Example response format:
{
  "suggestionsSummary": "Adjusted the shop's gold amount to better match its level range and suggested a more thematic keeper name.",
  "gold": 2500,
  "keeperName": "Eldara Moonweaver"
}`;
};

/**
 * Gets the specification for a specific field
 * @param {string} field - Field name
 * @returns {Object} Field specification
 */
const getFieldSpecification = (field) => {
    const specs = {
        // Shop Details
        name: {
            type: 'string',
            description: 'Suggested name for the shop'
        },
        keeperName: {
            type: 'string',
            description: 'Suggested name for the shopkeeper'
        },
        type: {
            type: 'string',
            description: 'Suggested type/category of shop'
        },
        location: {
            type: 'string',
            description: 'Suggested location description'
        },
        description: {
            type: 'string',
            description: 'Suggested shop description'
        },
        keeperDescription: {
            type: 'string',
            description: 'Suggested shopkeeper description'
        },
        
        // Parameters
        gold: {
            type: 'number',
            description: 'Suggested gold amount'
        },
        levelRange: {
            type: 'object: { min: number, max: number }',
            description: 'Suggested level range with minimum and maximum values'
        },
        itemBias: {
            type: 'object: { x: number, y: number }',
            description: 'Suggested item bias values (between 0 and 1)'
        },
        rarityDistribution: {
            type: 'object: { Common: number, Uncommon: number, Rare: number, Unique: number }',
            description: 'Suggested rarity distribution percentages (must sum to 100)'
        },
        
        // Filters
        filterCategories: {
            type: 'object: { included: string[], excluded: string[] }',
            description: 'Suggested category filters'
        }
    };

    return specs[field] || { type: 'unknown', description: 'Unknown field' };
};

/**
 * Validates and parses the AI response into a structured format
 * @param {string} response - Raw AI response
 * @param {Array} expectedFields - List of fields that were requested
 * @returns {Object} Parsed and validated response object
 */
export const parseAIResponse = (response, expectedFields) => {
    try {
        // Extract JSON from the response (in case there's additional text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON object found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!parsed.suggestionsSummary) {
            throw new Error('Response missing suggestionsSummary');
        }

        // Validate and clean up each expected field
        expectedFields.forEach(field => {
            if (parsed[field] !== undefined) {
                parsed[field] = validateField(field, parsed[field]);
            }
        });

        return parsed;
    } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to parse AI response into required format');
    }
};

/**
 * Validates and cleans up a field value based on its type
 * @param {string} field - Field name
 * @param {any} value - Field value to validate
 * @returns {any} Validated and cleaned up value
 */
const validateField = (field, value) => {
    const spec = getFieldSpecification(field);
    let distribution, sum;
    
    switch (spec.type) {
        case 'number':
            return typeof value === 'number' ? value : parseFloat(value);
            
        case 'string':
            return String(value);
            
        case 'object: { min: number, max: number }':
            if (typeof value !== 'object' || value === null) throw new Error(`Invalid ${field} format`);
            return {
                min: typeof value.min === 'number' ? value.min : parseFloat(value.min),
                max: typeof value.max === 'number' ? value.max : parseFloat(value.max)
            };
            
        case 'object: { x: number, y: number }':
            if (typeof value !== 'object' || value === null) throw new Error(`Invalid ${field} format`);
            return {
                x: typeof value.x === 'number' ? value.x : parseFloat(value.x),
                y: typeof value.y === 'number' ? value.y : parseFloat(value.y)
            };
            
        case 'object: { Common: number, Uncommon: number, Rare: number, Unique: number }':
            if (typeof value !== 'object' || value === null) throw new Error(`Invalid ${field} format`);
            distribution = {
                Common: typeof value.Common === 'number' ? value.Common : parseFloat(value.Common),
                Uncommon: typeof value.Uncommon === 'number' ? value.Uncommon : parseFloat(value.Uncommon),
                Rare: typeof value.Rare === 'number' ? value.Rare : parseFloat(value.Rare),
                Unique: typeof value.Unique === 'number' ? value.Unique : parseFloat(value.Unique)
            };
            sum = Object.values(distribution).reduce((a, b) => a + b, 0);
            if (Math.abs(sum - 100) > 0.01) throw new Error('Rarity distribution must sum to 100');
            return distribution;
            
        case 'object: { included: string[], excluded: string[] }':
            if (typeof value !== 'object' || value === null) throw new Error(`Invalid ${field} format`);
            return {
                included: Array.isArray(value.included) ? value.included.map(String) : [],
                excluded: Array.isArray(value.excluded) ? value.excluded.map(String) : []
            };
            
        default:
            return value;
    }
}; 