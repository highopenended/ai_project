/**
 * AI Prompt Generator
 *
 * This module serves as the central hub for generating AI prompts used in the shop generator.
 * It combines shop data, preserved fields, and conversation history to create comprehensive
 * prompts for the AI assistant.
 */

import { AI_RULES } from "./aiConstants";
import { generatePrompt_shopFields } from "./aiPromptGen_shopFields";
import { generatePrompt_shopAnalysis } from "./aiPromptGen_shopAnalysis";
import { generatePrompt_preservedFields } from "./aiPromptGen_preservedFields";
import { generateFormatSpecification } from "./aiResponseFormatter";

/**
 * Generates a complete AI prompt for shop analysis with preserved fields
 *
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @param {Object} preservedFields - Fields marked as preserved by the user
 * @param {string} conversationHistory - Previous conversation history
 * @returns {string} Complete AI prompt
 */
export const generateAnalysisPrompt = (shopSnapshot, preservedFields, conversationHistory) => {
    // Format all shop fields
    const promptPiece_shopData = generatePrompt_shopFields(shopSnapshot);

    // Analyze shop data against reference values
    const promptPiece_shopAnalysis = generatePrompt_shopAnalysis(shopSnapshot);

    // Format preserved fields and get fields to improve
    const { promptText_preservedFields, promptText_unpreservedFields } = generatePrompt_preservedFields(
        preservedFields,
        shopSnapshot
    );

    // Generate format specification for the response
    const formatSpec = generateFormatSpecification(promptText_unpreservedFields);

    // Add filter constraints instructions
    const filterConstraintsText = generateFilterConstraintsText(shopSnapshot);

    // Current shop values:
    // ${promptPiece_shopData}

    // Construct the complete prompt
    return `${AI_RULES}

Shop Analysis:
${promptPiece_shopAnalysis}

Previous conversation history:
${conversationHistory}

${promptText_preservedFields}

${filterConstraintsText}

${formatSpec}`;
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
    const promptPiece_shopData = generatePrompt_shopFields(shopSnapshot);

    // Analyze shop data against reference values
    const promptPiece_shopAnalysis = generatePrompt_shopAnalysis(shopSnapshot);

    // Add filter constraints instructions
    const filterConstraintsText = generateFilterConstraintsText(shopSnapshot);

    return `${AI_RULES}

Current shop values:
${promptPiece_shopData}

Shop Analysis:
${promptPiece_shopAnalysis}

${filterConstraintsText}

Previous conversation history:
${conversationHistory}

Current question: ${userQuestion}

Format your response with clear headings using **bold text** for section titles and bullet points for lists.`;
};

/**
 * Generates text explaining filter constraints
 *
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @returns {string} Filter constraints text
 */
const generateFilterConstraintsText = (shopSnapshot) => {
    if (!shopSnapshot.availableFilters) return "";

    return `IMPORTANT FILTER CONSTRAINTS:
When suggesting changes to category filters, you MUST ONLY suggest options from the available categories list provided above. Do not suggest any categories that are not in this list.

If the user asks about adding specific categories, verify they exist in the available options before suggesting them. If they don't exist in the available options, politely inform the user that those options are not available and suggest alternatives from the valid list.`;
};
