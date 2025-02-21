import React from "react";
import PropTypes from "prop-types";
import "./UnsavedChangesDialogue.css";

// Define selection states to match the constants used elsewhere
const SELECTION_STATES = {
    INCLUDE: 1,
    EXCLUDE: -1,
    IGNORE: 0
};

const UnsavedChangesDialogue = ({
    onConfirm,
    onCancel,
    changes,
    currentShopName,
    headerText = "Unsaved Changes",
    continueButtonText = "Discard all changes and continue",
    cancelButtonText = "Cancel",
    description,
}) => {
    const formatFilterState = (key, state) => {
        const numericState = parseInt(state);
        switch (numericState) {
            case SELECTION_STATES.INCLUDE:
                return <span className="filter-tag filter-include">{key}</span>;
            case SELECTION_STATES.EXCLUDE:
                return <span className="filter-tag filter-exclude">{key}</span>;
            case SELECTION_STATES.IGNORE:
                return <span className="filter-tag filter-ignore">{key}</span>;
            default:
                return key;
        }
    };

    const formatFilterObject = (obj) => {
        if (!obj || Object.keys(obj).length === 0) return "No filters";
        
        return (
            <div className="filter-tags-container">
                {Object.entries(obj).map(([key, state], index) => (
                    <div key={`${key}-${index}`} className="filter-tag-row">
                        {formatFilterState(key, state)}
                    </div>
                ))}
            </div>
        );
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return "N/A";

        // Handle Maps (for filter states)
        if (value instanceof Map) {
            return formatFilterObject(Object.fromEntries(value));
        }

        // Handle arrays (for filter state entries)
        if (Array.isArray(value)) {
            return formatFilterObject(Object.fromEntries(value));
        }

        // Handle objects
        if (typeof value === "object" && value !== null) {
            // Handle bias coordinates
            if ("x" in value && "y" in value) {
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
            if (Object.keys(value).some((key) => ["Common", "Uncommon", "Rare", "Unique"].includes(key))) {
                return Object.entries(value)
                    .map(([key, val]) => `${key}: ${val.toFixed(2)}%`)
                    .join(", ");
            }

            // Handle filter states
            return formatFilterObject(value);
        }

        return value.toString();
    };

    const renderChangeSection = (title, changes) => {
        if (!changes || Object.keys(changes).length === 0) return null;

        const renderFilterChange = (field, values) => {
            // Get all unique keys from both old and new states
            const allKeys = new Set([
                ...Object.keys(values.old || {}),
                ...Object.keys(values.new || {})
            ]);

            // Create arrays of tags for both columns, maintaining order
            const oldTags = [];
            const newTags = [];

            allKeys.forEach(key => {
                const oldState = parseInt(values.old?.[key] || 0);
                const newState = parseInt(values.new?.[key] || 0);

                oldTags.push(
                    <div key={`old-${key}`} className="filter-tag-row">
                        {formatFilterState(key, oldState)}
                    </div>
                );
                newTags.push(
                    <div key={`new-${key}`} className="filter-tag-row">
                        {formatFilterState(key, newState)}
                    </div>
                );
            });

            return (
                <React.Fragment key={field}>
                    <div className="changes-field">{field}</div>
                    <div className="changes-value">
                        <div className="filter-tags-container">
                            {oldTags}
                        </div>
                    </div>
                    <div className="changes-value changes-value-new">
                        <div className="filter-tags-container">
                            {newTags}
                        </div>
                    </div>
                </React.Fragment>
            );
        };

        // Special handling for filter sections
        if (title.includes("Filters") && changes.filters) {
            return (
                <div className="changes-section">
                    <h4 className="changes-section-title">{title}</h4>
                    <div className="changes-grid">
                        <div className="changes-header">Field</div>
                        <div className="changes-header">Before Changes</div>
                        <div className="changes-header">After Changes</div>
                        {renderFilterChange("filters", changes.filters)}
                    </div>
                </div>
            );
        }

        return (
            <div className="changes-section">
                <h4 className="changes-section-title">{title}</h4>
                <div className="changes-grid">
                    <div className="changes-header">Field</div>
                    <div className="changes-header">Before Changes</div>
                    <div className="changes-header">After Changes</div>
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
        <div className="unsaved-changes-overlay" onClick={onCancel}>
            <div className="unsaved-changes-dialogue" onClick={(e) => e.stopPropagation()}>
                <h3 className="unsaved-changes-title">{headerText}</h3>
                <h4>{currentShopName}</h4>
                <p className="unsaved-changes-description">
                    {description || `You have unsaved changes to the current shop "${currentShopName}"`}
                </p>
                <div className="unsaved-changes-content">
                    {renderChangeSection("Basic Information", changes.basic)}
                    {renderChangeSection("Parameters", changes.parameters)}
                    {renderChangeSection("Category Filters", changes.categoryFilters)}
                    {renderChangeSection("Subcategory Filters", changes.subcategoryFilters)}
                    {renderChangeSection("Trait Filters", changes.traitFilters)}
                    {changes.hasInventoryChanged && (
                        <div className="changes-section">
                            <h4 className="changes-section-title">Inventory</h4>
                            <p className="inventory-change-message">
                                The shop inventory has been refreshed at least once
                            </p>
                        </div>
                    )}
                </div>
                <div className="unsaved-changes-buttons">
                    <button className="unsaved-changes-button unsaved-changes-proceed" onClick={onConfirm}>
                        {continueButtonText}
                    </button>
                    <button className="unsaved-changes-button unsaved-changes-cancel" onClick={onCancel}>
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
        categoryFilters: PropTypes.shape({
            filters: PropTypes.shape({
                old: PropTypes.object,
                new: PropTypes.object
            })
        }),
        subcategoryFilters: PropTypes.shape({
            filters: PropTypes.shape({
                old: PropTypes.object,
                new: PropTypes.object
            })
        }),
        traitFilters: PropTypes.shape({
            filters: PropTypes.shape({
                old: PropTypes.object,
                new: PropTypes.object
            })
        }),
        hasInventoryChanged: PropTypes.bool.isRequired,
    }).isRequired,
    currentShopName: PropTypes.string.isRequired,
    headerText: PropTypes.string,
    continueButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    description: PropTypes.string,
};

export default UnsavedChangesDialogue;
