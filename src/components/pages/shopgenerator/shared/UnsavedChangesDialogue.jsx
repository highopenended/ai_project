import React from 'react';
import PropTypes from 'prop-types';
import './UnsavedChangesDialogue.css';

const UnsavedChangesDialogue = ({ 
    onConfirm, 
    onCancel, 
    changes, 
    currentShopName,
    headerText = "Unsaved Changes",
    continueButtonText = "Discard all changes and continue",
    cancelButtonText = "Cancel",
    description
}) => {
    const formatValue = (value) => {
        if (value === null || value === undefined) return 'N/A';

        // Handle Maps (for filter states)
        if (value instanceof Map) {
            return Array.from(value.entries())
                .map(([key, state]) => `${key}: ${state}`)
                .join(', ');
        }

        // Handle arrays (for filter state entries)
        if (Array.isArray(value)) {
            return value.map(([key, state]) => `${key}: ${state}`).join(', ');
        }

        // Handle objects
        if (typeof value === 'object' && value !== null) {
            // Handle bias coordinates
            if ('x' in value && 'y' in value) {
                const varietyPercent = Math.round(value.x * 100);
                const costPercent = Math.round(value.y * 100);
                return (
                    <div className="bias-value">
                        <div>Variety: {varietyPercent}%</div>
                        <div>Cost: {costPercent}%</div>
                    </div>
                );
            }

            // Handle rarity distribution
            if (Object.keys(value).some(key => ['Common', 'Uncommon', 'Rare', 'Unique'].includes(key))) {
                return Object.entries(value)
                    .map(([key, val]) => `${key}: ${val.toFixed(2)}%`)
                    .join(', ');
            }

            // Handle filter states object
            if ('categories' in value || 'subcategories' in value || 'traits' in value) {
                return Object.entries(value)
                    .map(([filterType, entries]) => {
                        const formattedEntries = Array.isArray(entries) 
                            ? entries.map(([key, state]) => `${key}: ${state}`).join(', ')
                            : 'No filters';
                        return `${filterType}: {${formattedEntries}}`;
                    })
                    .join('\n');
            }
        }

        return value.toString();
    };

    const renderChangeSection = (title, changes) => {
        if (Object.keys(changes).length === 0) return null;

        return (
            <div className="changes-section">
                <h4 className="changes-section-title">{title}</h4>
                <div className="changes-grid">
                    <div className="changes-header">Field</div>
                    <div className="changes-header">Original</div>
                    <div className="changes-header">New</div>
                    {Object.entries(changes).map(([field, values]) => (
                        <React.Fragment key={field}>
                            <div className="changes-field">{field}</div>
                            <div className="changes-value">{formatValue(values.old)}</div>
                            <div className="changes-value changes-value-new">{formatValue(values.new)}</div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="unsaved-changes-overlay">
            <div className="unsaved-changes-dialogue">
                <h3 className="unsaved-changes-title">{headerText}</h3>
                <p className="unsaved-changes-description">
                    <h2 className="shop-name">&ldquo;{currentShopName}&rdquo;</h2>.
                    {description || `You have unsaved changes to the current shop `}
                </p>
                <div className="unsaved-changes-content">
                    {renderChangeSection("Basic Information", changes.basic)}
                    {renderChangeSection("Parameters", changes.parameters)}
                    {changes.hasInventoryChanged && (
                        <div className="changes-section">
                            <h4 className="changes-section-title">Inventory</h4>
                            <p className="inventory-change-message">The shop inventory has been refreshed at least once</p>
                        </div>
                    )}
                </div>
                <div className="unsaved-changes-buttons">
                    <button 
                        className="unsaved-changes-button unsaved-changes-proceed"
                        onClick={onConfirm}
                    >
                        {continueButtonText}
                    </button>
                    <button 
                        className="unsaved-changes-button unsaved-changes-cancel"
                        onClick={onCancel}
                    >
                        {cancelButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

UnsavedChangesDialogue.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    changes: PropTypes.shape({
        basic: PropTypes.object.isRequired,
        parameters: PropTypes.object.isRequired,
        hasInventoryChanged: PropTypes.bool.isRequired
    }).isRequired,
    currentShopName: PropTypes.string.isRequired,
    headerText: PropTypes.string,
    continueButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    description: PropTypes.string
};

export default UnsavedChangesDialogue; 