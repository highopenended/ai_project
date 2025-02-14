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

Tab_Parameters.displayName = "Parameters";
Tab_Parameters.minWidth = 220;

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
            <CategoryFilter />
            <SubcategoryFilter />
            <TraitFilter />
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
};

export default Tab_Parameters;
