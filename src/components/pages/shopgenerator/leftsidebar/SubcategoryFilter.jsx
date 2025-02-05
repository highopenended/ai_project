import { useState } from 'react';
import { useCategoryContext, SELECTION_STATES } from '../context/CategoryContext';
import TagContainer from '../components/TagContainer';
import Tag from '../components/Tag';
import Section from '../components/Section';
import ButtonGroup from '../components/ButtonGroup';

function SubcategoryFilter() {
    const {
        categoryData,
        getCategoryState,
        getSubcategoryState,
        toggleSubcategory,
        clearSubcategorySelections
    } = useCategoryContext();

    const [subcategoryFilter, setSubcategoryFilter] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // Get all unique subcategories from selected categories
    const getRelevantSubcategories = () => {
        const includedCategories = Object.keys(categoryData).filter(
            cat => getCategoryState(cat) === SELECTION_STATES.INCLUDE
        );

        if (includedCategories.length === 0) {
            return Object.values(categoryData)
                .flatMap(cat => cat.subcategories)
                .filter((value, index, self) => self.indexOf(value) === index)
                .sort();
        }
        return includedCategories
            .flatMap(category => categoryData[category]?.subcategories || [])
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();
    };

    // Filter subcategories based on search
    const filteredSubcategories = getRelevantSubcategories()
        .filter(subcategory => 
            subcategory.toLowerCase().includes(subcategoryFilter.toLowerCase())
        );

    // Define getTagClassName function
    const getTagClassName = (state) => {
        const baseClass = 'tag';
        if (state === 'INCLUDE') return `${baseClass} included`;
        if (state === 'EXCLUDE') return `${baseClass} excluded`;
        return baseClass;
    };

    // Ensure getSubcategoryState returns a string
    const getSubcategoryStateString = (subcategory) => {
        const state = getSubcategoryState(subcategory);
        return state === SELECTION_STATES.INCLUDE ? 'INCLUDE' :
               state === SELECTION_STATES.EXCLUDE ? 'EXCLUDE' : 'NONE';
    };

    return (
        <div>
             <Section
                title="Subcategories"

                buttonGroup={
                    <ButtonGroup handleReset={clearSubcategorySelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                }
            >
                {!isCollapsed && (
                    <>
                        <input
                            type="text"
                            placeholder="Search subcategories..."
                            value={subcategoryFilter}
                            onChange={(e) => setSubcategoryFilter(e.target.value)}
                            className="search-input"
                        />
                        <TagContainer 
                            tags={filteredSubcategories.map(subcategory => ({
                                name: subcategory,
                                state: getSubcategoryStateString(subcategory),
                                count: 0 // Assuming count is not used here
                            }))}
                            onTagClick={toggleSubcategory}
                            getTagClassName={getTagClassName}
                        >
                        {filteredSubcategories.map(subcategory => (
                            <Tag 
                                key={subcategory}
                                name={subcategory}
                                state={getSubcategoryStateString(subcategory)}
                                onClick={() => toggleSubcategory(subcategory)}
                            />
                        ))}
                        </TagContainer>
                    </>
                )}
            </Section>
        </div>
    );
}

export default SubcategoryFilter; 