import { useState } from "react";
import { useShopGenerator } from "../../../../../../context/ShopGeneratorContext";
import { SELECTION_STATES } from "../../../../../../context/shopGeneratorConstants";
import Tag from "../../../shared/Tag";
import Section from "../../../shared/Section";
import ButtonGroup from "../../../shared/ButtonGroup";

function SubcategoryFilter() {
    const { categoryData, categoryStates, getSubcategoryState, toggleSubcategory, clearSubcategorySelections } =
        useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Get all subcategories - either from selected categories or all categories if none selected
    const subcategories = new Set();
    const hasSelectedCategories = Array.from(categoryStates.values()).some(state => state === SELECTION_STATES.INCLUDE);
    
    Object.entries(categoryData.categories).forEach(([category, data]) => {
        if (!hasSelectedCategories || categoryStates.get(category) === SELECTION_STATES.INCLUDE) {
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
                        {Array.from(subcategories).map((subcategory, index) => (
                            <Tag
                                name={`${subcategory} (${categoryData.subcategoryCounts[subcategory]})`}
                                key={subcategory + index}
                                state={getSubcategoryState(subcategory)}
                                onClick={() => toggleSubcategory(subcategory)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

export default SubcategoryFilter;
