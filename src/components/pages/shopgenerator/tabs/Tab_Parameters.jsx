// import React from 'react';
import GoldInput from "./tab_parameters/goldinput/GoldInput";
import LevelInput from "./tab_parameters/levelinput/LevelInput";
import BiasGrid from "./tab_parameters/biasgrid/BiasGrid";
import RaritySliders from "./tab_parameters/raritysliders/RaritySliders";
import CategoryFilter from "./tab_parameters/categoryfilter/CategoryFilter";
import SubcategoryFilter from "./tab_parameters/subcategoryfilter/SubcategoryFilter";
import TraitFilter from "./tab_parameters/traitfilter/TraitFilter";
import "./Tab_Parameters.css";
import PropTypes from "prop-types";

Tab_Parameters.displayName = "Parameters";
Tab_Parameters.minWidth = 200;

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
        <div>
            <div className="parameter-sections">
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
