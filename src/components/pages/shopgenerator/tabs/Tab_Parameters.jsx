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
    const handleGoldChange = (gold) => {
        setCurrentGold(gold);
    };

    const handleLowestLevelChange = (level) => {
        setLowestLevel(level);
    };

    const handleHighestLevelChange = (level) => {
        setHighestLevel(level);
    };

    const handleRarityChange = (rarity) => {
        setRarityDistribution(rarity);
    };

    const handleBiasChange = (bias) => {
        setItemBias(bias);
    };

    return (
        <div>
            <GenerateButton onClick={handleGenerateClick} />
            <div className="parameter-sections">
                <GoldInput onChange={handleGoldChange} />
                <LevelInput
                    lowestLevel={lowestLevel}
                    highestLevel={highestLevel}
                    onLowestLevelChange={handleLowestLevelChange}
                    onHighestLevelChange={handleHighestLevelChange}
                />
                <RaritySliders onChange={handleRarityChange} />
                {/* <BiasGrid onChange={handleBiasChange} value={handleBiasChange}/> */}
            </div>
        </div>
    );
}

Tab_Parameters.propTypes = {
    handleGenerateClick: PropTypes.func.isRequired,
    setCurrentGold: PropTypes.func.isRequired,
    setLowestLevel: PropTypes.func.isRequired,
    setHighestLevel: PropTypes.func.isRequired,
    setRarityDistribution: PropTypes.func.isRequired,
    setItemBias: PropTypes.func.isRequired,
};

export default Tab_Parameters;
