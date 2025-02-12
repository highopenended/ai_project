// import React from 'react';
import GenerateButton from "./tab_parameters/generatebutton/GenerateButton";
import GoldInput from "./tab_parameters/goldinput/GoldInput";
import LevelInput from "./tab_parameters/levelinput/LevelInput";
import BiasGrid from "./tab_parameters/biasgrid/BiasGrid";
import RaritySliders from "./tab_parameters/raritysliders/RaritySliders";
import "./Tab_Parameters.css";
import PropTypes from "prop-types";

Tab_Parameters.displayName = "Shop Details";
Tab_Parameters.minWidth = 100;

function Tab_Parameters({
    handleGenerateClick,
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
            <GenerateButton onClick={handleGenerateClick} />
            <div className="parameter-sections">
                <GoldInput setCurrentGold={setCurrentGold} currentGold={currentGold} />
                <LevelInput
                    lowestLevel={lowestLevel}
                    highestLevel={highestLevel}
                    setLowestLevel={setLowestLevel}
                    setHighestLevel={setHighestLevel}
                />
                <RaritySliders setRarityDistribution={setRarityDistribution} rarityDistribution={rarityDistribution} />
                
            </div>
        </div>
    );
}

Tab_Parameters.propTypes = {
    handleGenerateClick: PropTypes.func.isRequired,
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
