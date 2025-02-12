import { useState } from "react";
import { useShopGenerator } from "../../../../../context/ShopGeneratorContext";
import Tag from "../../shared/Tag";
import Section from "../../shared/Section";
import ButtonGroup from "../../shared/ButtonGroup";

function CategoryFilter() {
    const { categoryData, getCategoryState, toggleCategory, clearCategorySelections } = useShopGenerator();
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <Section
            title="Categories"
            buttonGroup={
                <ButtonGroup handleReset={clearCategorySelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            <div className="filter-grid">   
                {!isCollapsed && (
                    <div className="filter-grid-content">
                        {Object.entries(categoryData.categories).map(([category, data], index) => (
                            <Tag
                                name={`${category} (${data.count})`}
                                key={category + index}
                                state={getCategoryState(category)}
                                onClick={() => toggleCategory(category)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

export default CategoryFilter;
