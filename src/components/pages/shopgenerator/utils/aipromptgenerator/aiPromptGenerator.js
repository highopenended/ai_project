/**
 * AI Prompt Generator
 *
 * This module serves as the central hub for generating AI prompts used in the shop generator.
 * It combines shop data, preserved fields, and conversation history to create comprehensive
 * prompts for the AI assistant.
 */

import { AI_RULES } from "./aiConstants";
// import { getPiece_shopFields } from "./promptPiece_shopFields"; (Not used at this time, keep commented out)
import { getPiece_shopAnalysis } from "./promptPiece_shopAnalysis";
import { getPiece_preservedFields } from "./promptPiece_preservedFields";
import { getPiece_responseExample } from "./promptPiece_responseExample";
import { getPiece_filterContraints } from "./promptPiece_filterOptions";


/**
 * Generates a complete AI prompt for shop analysis with preserved fields
 *
 * @param {Object} shopSnapshot - Current shop data snapshot
 * @param {Object} preservedFields - Fields marked as preserved by the user
 * @returns {string} Complete AI prompt
 */
export const generateAnalysisPrompt = (shopSnapshot, preservedFields) => {

    const includeFilterConstraints = false;

    // Analyze shop data against reference values
    const promptPiece_shopAnalysis = getPiece_shopAnalysis(shopSnapshot, preservedFields);

    // Format preserved fields and get fields to improve
    const { promptPiece_preservedFields, promptPiece_unpreservedFields } = getPiece_preservedFields(
        preservedFields,
        shopSnapshot
    );

    // Generate an example of the response format for the AI to follow
    const promptPiece_responseExample = getPiece_responseExample(promptPiece_unpreservedFields);

    // Add filter constraints instructions
    const promptPiece_filterConstraints = getPiece_filterContraints(shopSnapshot);

    // Create an array of prompt sections
    const promptSections = [
        AI_RULES,
        promptPiece_shopAnalysis,
        promptPiece_preservedFields
    ];
    
    // Only add filter constraints if needed
    if (includeFilterConstraints && promptPiece_filterConstraints) {
        promptSections.push(promptPiece_filterConstraints);
    }
    
    // Add response example and rules
    promptSections.push(promptPiece_responseExample);
    promptSections.push(`Analysis-Specific Rules:

1) Keep your responses very concise and to the point.
2) The user only see the parts starting with "Current question:", so anything before that should be treated as YOUR observations, not something the user said.
3) For the analyses, you should definitely mention it in your reasoning if they are a relatively extreme case (Judge this by percentage, words like "very", etc.)
4) Only offer one suggestion per 'FIELD TO IMPROVE'`);

    // Join all sections with double newlines
    return promptSections.filter(Boolean).join('\n\n');
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

// Construct the complete prompt
const finalPrompt = `
${AI_RULES}

Current question: ${userQuestion}


Conversation Specific Rules:
1) Keep your responses very concise and to the point.
2) You know how to keep the conversation on track and not get off topic.
3) Your goal is to generate information that will be immediately applicable to the shop so that the DM can better describe it to the players.




Format your response with clear headings using **bold text** for section titles and bullet points for lists.`;
    // Return the final prompt
    return finalPrompt;
};
