import React from "react";
import PropTypes from "prop-types";
import "./UnsavedChangesDialogue.css";

// Import our new components
import ChangesOuterWrapper from "./components/changesouterwrapper/ChangesOuterWrapper";
import BasicDetail from "./components/basicdetail/BasicDetail";
import GoldAmount from "./components/goldamount/GoldAmount";
import LevelRange from "./components/levelrange/LevelRange";
import ItemBias from "./components/itembias/ItemBias";
import RarityDistributions from "./components/raritydistributions/RarityDistributions";
import FilterGroup from "./components/filtergroups/FilterGroup";

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
    const renderBasicChanges = () => {
        if (!changes.basic || Object.keys(changes.basic).length === 0) return null;

        return Object.entries(changes.basic).map(([field, values]) => (
            <ChangesOuterWrapper
                key={field}
                fieldName={field}
                beforeChangeElement={<BasicDetail value={values.old} className="before-change" />}
                afterChangeElement={<BasicDetail value={values.new} className="after-change" />}
                changes={values}
            />
        ));
    };

    const renderParameterChanges = () => {
        if (!changes.parameters || Object.keys(changes.parameters).length === 0) return null;

        return Object.entries(changes.parameters).map(([field, values]) => {
            switch (field) {
                case 'gold':
                    return (
                        <ChangesOuterWrapper
                            key={field}
                            fieldName="Gold Amount"
                            beforeChangeElement={<GoldAmount value={values.old} className="before-change" />}
                            afterChangeElement={<GoldAmount value={values.new} className="after-change" />}
                            changes={values}
                        />
                    );
                case 'levelMin':
                case 'levelMax':
                    // Only render once for both min and max
                    if (field === 'levelMin') {
                        const minValues = changes.parameters.levelMin || {};
                        const maxValues = changes.parameters.levelMax || {};
                        return (
                            <ChangesOuterWrapper
                                key="levelRange"
                                fieldName="Level Range"
                                beforeChangeElement={
                                    <LevelRange
                                        min={minValues.old}
                                        max={maxValues.old}
                                        className="before-change"
                                    />
                                }
                                afterChangeElement={
                                    <LevelRange
                                        min={minValues.new}
                                        max={maxValues.new}
                                        className="after-change"
                                    />
                                }
                                changes={{ min: minValues, max: maxValues }}
                            />
                        );
                    }
                    return null;
                case 'itemBias':
                    return (
                        <ChangesOuterWrapper
                            key={field}
                            fieldName="Item Bias"
                            beforeChangeElement={
                                <ItemBias
                                    x={values.old?.x}
                                    y={values.old?.y}
                                    className="before-change"
                                />
                            }
                            afterChangeElement={
                                <ItemBias
                                    x={values.new?.x}
                                    y={values.new?.y}
                                    className="after-change"
                                />
                            }
                            changes={values}
                        />
                    );
                case 'rarityDistribution':
                    return (
                        <ChangesOuterWrapper
                            key={field}
                            fieldName="Rarity Distribution"
                            beforeChangeElement={
                                <RarityDistributions
                                    distributions={values.old}
                                    className="before-change"
                                />
                            }
                            afterChangeElement={
                                <RarityDistributions
                                    distributions={values.new}
                                    className="after-change"
                                />
                            }
                            changes={values}
                        />
                    );
                default:
                    return null;
            }
        });
    };

    const renderFilterChanges = () => {
        const sections = [
            { key: 'categoryFilters', title: 'Category Filters' },
            { key: 'subcategoryFilters', title: 'Subcategory Filters' },
            { key: 'traitFilters', title: 'Trait Filters' }
        ];

        return sections.map(({ key, title }) => {
            if (!changes[key]?.filters) return null;

            return (
                <ChangesOuterWrapper
                    key={key}
                    fieldName={title}
                    beforeChangeElement={
                        <FilterGroup
                            filters={changes[key].filters.old}
                            className="before-change"
                        />
                    }
                    afterChangeElement={
                        <FilterGroup
                            filters={changes[key].filters.new}
                            className="after-change"
                        />
                    }
                    changes={changes[key].filters}
                />
            );
        });
    };

    const renderInventoryChanges = () => {
        if (!changes.hasInventoryChanged) return null;

        return (
            <ChangesOuterWrapper
                fieldName="Inventory"
                isFullWidth={true}
                className="inventory-changes"
                changes={{ hasChanged: true }}
            >
                <div className="inventory-change-message">
                    The shop inventory has been refreshed at least once
                </div>
            </ChangesOuterWrapper>
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
                    {renderBasicChanges()}
                    {renderParameterChanges()}
                    {renderFilterChanges()}
                    {renderInventoryChanges()}
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
