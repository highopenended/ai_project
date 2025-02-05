import { useState } from "react";
import { useCategoryContext, SELECTION_STATES } from "../../context/CategoryContext";
import TagContainer from "../../components/TagContainer";
import Section from "../../components/Section";
import ButtonGroup from "../../components/ButtonGroup";

function CategoryFilter() {
    const { categoryData, getCategoryState, toggleCategory, clearCategorySelections } = useCategoryContext();

    const [categoryFilter, setCategoryFilter] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Filter categories based on search
    const filteredCategories = Object.keys(categoryData)
        .filter((category) => category.toLowerCase().includes(categoryFilter.toLowerCase()))
        .sort();

    // Define getTagClassName function
    const getTagClassName = (state) => {
        const baseClass = "tag";
        if (state === "INCLUDE") return `${baseClass} included`;
        if (state === "EXCLUDE") return `${baseClass} excluded`;
        return baseClass;
    };

    // Ensure getCategoryState returns a string
    const getCategoryStateString = (category) => {
        const state = getCategoryState(category);
        return state === SELECTION_STATES.INCLUDE ? "INCLUDE" : state === SELECTION_STATES.EXCLUDE ? "EXCLUDE" : "NONE";
    };

    return (
        <div>
            <Section
                title="Categories"
                buttonGroup={
                    <ButtonGroup handleReset={clearCategorySelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                }
            >
                {!isCollapsed && (
                    <>
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="search-input"
                        />
                        <TagContainer
                            tags={filteredCategories.map((category) => ({
                                name: category,
                                state: getCategoryStateString(category),
                                count: categoryData[category].count,
                            }))}
                            onTagClick={toggleCategory}
                            getTagClassName={getTagClassName}
                        />
                    </>
                )}
            </Section>
        </div>
    );
}

export default CategoryFilter;
