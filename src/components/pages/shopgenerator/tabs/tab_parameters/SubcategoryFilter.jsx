import { useState } from "react";
import { useShopGenerator } from "../../../../../context/ShopGeneratorContext";
import { SELECTION_STATES } from "../../../../../context/shopGeneratorConstants";
import Tag from "../../shared/Tag";
import Section from "../../shared/Section";
import ButtonGroup from "../../shared/ButtonGroup";

function SubcategoryFilter() {
    const { categoryData, categoryStates, getSubcategoryState, toggleSubcategory, clearSubcategorySelections } =
        useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Get all subcategories from included categories
    const subcategories = new Set();
    Object.entries(categoryData).forEach(([category, data]) => {
        if (categoryStates.get(category) === SELECTION_STATES.INCLUDE) {
            data.subcategories.forEach((subcategory) => subcategories.add(subcategory));
        }
    });

    return (
        <Section
            title="Subcategories"
            buttonGroup={
                <ButtonGroup
                    handleReset={clearSubcategorySelections}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
            }
        >
            <div className="filter-grid">
                {!isCollapsed && (
                    <div className="filter-grid-content">
                        {Array.from(subcategories).map((subcategory) => (
                            <Tag
                                name={`${subcategory} (${categoryData[subcategory].count})`}
                                key={subcategory}
                                state={getSubcategoryState(subcategory)}
                                onClick={() => toggleSubcategory(subcategory)}
                            />
                        ))}
                    </div>
                )}
            </div>
            <button onClick={clearSubcategorySelections} className="clear-button">
                Clear Subcategories
            </button>
        </Section>
    );
}

export default SubcategoryFilter;
