// import React from 'react';
import GoldInput from "./goldinput/GoldInput";
import LevelInput from "./levelinput/LevelInput";
import BiasGrid from "./biasgrid/BiasGrid";
import RaritySliders from "./raritysliders/RaritySliders";
import CategoryFilter from "./categoryfilter/CategoryFilter";
import SubcategoryFilter from "./subcategoryfilter/SubcategoryFilter";
import TraitFilter from "./traitfilter/TraitFilter";
import "./Tab_Parameters.css";
import PropTypes from "prop-types";

function Tab_Parameters({
    currentGold,
    setCurrentGold,
    lowestLevel,
    setLowestLevel,
    highestLevel,
    setHighestLevel,
    rarityDistribution,
    setRarityDistribution,
    itemBias,
    setItemBias,
    categoryData,
    categoryStates,
    getFilterState,
    toggleCategory,
    toggleSubcategory,
    toggleTrait,
    clearCategorySelections,
    clearSubcategorySelections,
    clearTraitSelections,
}) {
    return (
        <div className="main-wrapper-parameter">
            <GoldInput setCurrentGold={setCurrentGold} currentGold={currentGold} />
            <LevelInput
                lowestLevel={lowestLevel}
                highestLevel={highestLevel}
                setLowestLevel={setLowestLevel}
                setHighestLevel={setHighestLevel}
            />
            <RaritySliders setRarityDistribution={setRarityDistribution} rarityDistribution={rarityDistribution} />
            <BiasGrid setItemBias={setItemBias} itemBias={itemBias} />
            <CategoryFilter
                categoryData={categoryData}
                getFilterState={getFilterState}
                toggleCategory={toggleCategory}
                clearCategorySelections={clearCategorySelections}
            />
            <SubcategoryFilter
                categoryData={categoryData}
                categoryStates={categoryStates}
                getFilterState={getFilterState}
                toggleSubcategory={toggleSubcategory}
                clearSubcategorySelections={clearSubcategorySelections}
            />
            <TraitFilter
                getFilterState={getFilterState}
                toggleTrait={toggleTrait}
                clearTraitSelections={clearTraitSelections}
            />
        </div>
    );
}

Tab_Parameters.propTypes = {
    setCurrentGold: PropTypes.func.isRequired,
    setLowestLevel: PropTypes.func.isRequired,
    setHighestLevel: PropTypes.func.isRequired,
    currentGold: PropTypes.number.isRequired,
    lowestLevel: PropTypes.number.isRequired,
    highestLevel: PropTypes.number.isRequired,
    rarityDistribution: PropTypes.object.isRequired,
    setRarityDistribution: PropTypes.func.isRequired,
    itemBias: PropTypes.object.isRequired,
    setItemBias: PropTypes.func.isRequired,
    categoryData: PropTypes.object.isRequired,
    categoryStates: PropTypes.object.isRequired,
    getFilterState: PropTypes.func.isRequired,
    toggleCategory: PropTypes.func.isRequired,
    toggleSubcategory: PropTypes.func.isRequired,
    toggleTrait: PropTypes.func.isRequired,
    clearCategorySelections: PropTypes.func.isRequired,
    clearSubcategorySelections: PropTypes.func.isRequired,
    clearTraitSelections: PropTypes.func.isRequired,
};

Tab_Parameters.displayName = "Parameters";
Tab_Parameters.minWidth = 220;

export default Tab_Parameters;
