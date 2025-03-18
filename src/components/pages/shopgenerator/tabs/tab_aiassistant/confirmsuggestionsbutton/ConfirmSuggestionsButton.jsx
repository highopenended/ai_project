import React from 'react';
import PropTypes from 'prop-types';
import './ConfirmSuggestionsButton.css';
import ConfirmSuggestionsDialog from '../confirmsuggestionsdialog/ConfirmSuggestionsDialog';

/**
 * Button component that appears below AI suggestion messages
 * Allows users to apply the suggested changes to their shop
 * 
 * @param {Object} suggestedChanges - The changes suggested by the AI
 * @param {Function} onApply - Callback function to apply changes to shop state
 */
const ConfirmSuggestionsButton = ({ suggestedChanges, onApply }) => {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const handleOpenDialog = () => {
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    const handleConfirm = (sanitizedChanges) => {
        // Log the suggestions being applied
        console.log("CONFIRM SUGGESTIONS BUTTON - Applying sanitized suggestions:", JSON.stringify(sanitizedChanges, null, 2));
        
        // Pass the sanitized changes to the parent component
        onApply(sanitizedChanges);
        setIsDialogOpen(false);
    };

    return (
        <div className="confirm-suggestions-container">
            <button 
                className="confirm-suggestions-button"
                onClick={handleOpenDialog}
            >
                Apply Changes
            </button>
            
            {isDialogOpen && (
                <ConfirmSuggestionsDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                    onConfirm={handleConfirm}
                    suggestedChanges={suggestedChanges}
                />
            )}
        </div>
    );
};

ConfirmSuggestionsButton.propTypes = {
    suggestedChanges: PropTypes.object.isRequired,
    messageId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onApply: PropTypes.func.isRequired
};

export default ConfirmSuggestionsButton; 