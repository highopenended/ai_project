/**
 * AI Prompt Generator
 *
 * This module serves as the central hub for generating AI prompts used in the shop generator.
 * It combines shop data, preserved fields, and conversation history to create comprehensive
 * prompts for the AI assistant.
 */

import { AI_RULES } from "./aiConstants";
import { getPiece_shopFields } from "./promptPiece_shopFields";
import { getPiece_shopAnalysis } from "./promptPiece_shopAnalysis";
import { getPiece_preservedFields } from "./promptPiece_preservedFields";
import { getPiece_responseExample } from "./promptPiece_responseExample";
import { getPiece_filterContraints } from "./promptPiece_filterOptions";

/**
 * Generates a complete AI prompt for shop analysis with preserved fields
 *
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @param {Object} preservedFields - Fields marked as preserved by the user
 * @param {string} conversationHistory - Previous conversation history
 * @returns {string} Complete AI prompt
 */
export const generateAnalysisPrompt = (shopSnapshot, preservedFields, conversationHistory) => {
    // Format all shop fields (Not used at this time)
    // const promptPiece_shopData = getPiece_shopFields(shopSnapshot);

    // Analyze shop data against reference values
    const promptPiece_shopAnalysis = getPiece_shopAnalysis(shopSnapshot);

    // Format preserved fields and get fields to improve
    const { promptPiece_preservedFields, promptPiece_unpreservedFields } = getPiece_preservedFields(
        preservedFields,
        shopSnapshot
    );

    // Generate an example of the response format for the AI to follow
    const promptPiece_responseExample = getPiece_responseExample(promptPiece_unpreservedFields);

    // Add filter constraints instructions
    const promptPiece_filterConstraints = getPiece_filterContraints(shopSnapshot);

    // Construct the complete prompt
    const finalPrompt = `${AI_RULES}
Shop Analysis:

${promptPiece_shopAnalysis}

${promptPiece_preservedFields}

${promptPiece_filterConstraints}

${promptPiece_responseExample}

Previous conversation history:
${conversationHistory}`

    // Return the final prompt
    return finalPrompt;
};

/**
 * Generates a prompt for regular chat interactions
 *
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @param {string} conversationHistory - Previous conversation history
 * @param {string} userQuestion - User's current question
 * @returns {string} Complete chat prompt
 */
export const generateChatPrompt = (shopSnapshot, conversationHistory, userQuestion) => {
    // Format all shop fields
    const promptPiece_shopData = getPiece_shopFields(shopSnapshot);

    // Analyze shop data against reference values (Is the shop wealthy or poor? Is the rarity distribution balanced? Are the item biases normal or extreme?)
    const promptPiece_shopAnalysis = getPiece_shopAnalysis(shopSnapshot);

    // Add filter constraints instructions (Only use THESE category names, don't just make them up)
    const promptPiece_filterConstraints = getPiece_filterContraints(shopSnapshot);

    return `${AI_RULES}

Current shop values:
${promptPiece_shopData}

Shop Analysis:
${promptPiece_shopAnalysis}

Filter Constraints:
${promptPiece_filterConstraints}

Previous conversation history:
${conversationHistory}

Current question: ${userQuestion}

Format your response with clear headings using **bold text** for section titles and bullet points for lists.`;
};
