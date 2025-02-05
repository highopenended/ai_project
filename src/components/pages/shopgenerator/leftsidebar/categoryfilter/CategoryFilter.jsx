import { useState } from 'react';
import { useCategoryContext, SELECTION_STATES } from '../../context/CategoryContext';
import './CategoryFilter.css';
import DropdownArrow from '../../components/DropdownArrow';
import ResetButton from '../../components/ResetButton';
import SubcategoryFilter from '../subcategoryfilter/SubcategoryFilter';
import TagContainer from '../../components/TagContainer';


function CategoryFilter() {
    const {
        categoryData,
        getCategoryState,
        toggleCategory,
        clearCategorySelections
    } = useCategoryContext();

    const [categoryFilter, setCategoryFilter] = useState('');
    const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);

    // Filter categories based on search
    const filteredCategories = Object.keys(categoryData)
        .filter(category => 
            category.toLowerCase().includes(categoryFilter.toLowerCase())
        )
        .sort();

    // Define getTagClassName function
    const getTagClassName = (state) => {
        const baseClass = 'tag';
        if (state === 'INCLUDE') return `${baseClass} included`;
        if (state === 'EXCLUDE') return `${baseClass} excluded`;
        return baseClass;
    };

    // Ensure getCategoryState returns a string
    const getCategoryStateString = (category) => {
        const state = getCategoryState(category);
        return state === SELECTION_STATES.INCLUDE ? 'INCLUDE' :
               state === SELECTION_STATES.EXCLUDE ? 'EXCLUDE' : 'NONE';
    };

    return (
        <div className="category-filter">
            <div className="category-section">
                <div className="section-header">
                    <h3>Categories</h3>
                    <div className="buttons">
                        <ResetButton onClick={clearCategorySelections} title="Reset category selections"/>
                        <DropdownArrow isCollapsed={isCategoryCollapsed} toggleCollapse={() => setIsCategoryCollapsed(!isCategoryCollapsed)} />
                    </div>
                </div>
                {!isCategoryCollapsed && (
                    <>
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="search-input"
                        />
                        <TagContainer 
                            tags={filteredCategories.map(category => ({
                                name: category,
                                state: getCategoryStateString(category),
                                count: categoryData[category].count
                            }))}
                            onTagClick={toggleCategory}
                            getTagClassName={getTagClassName}
                        />
                    </>
                )}
            </div>

            <SubcategoryFilter />
        </div>
    );
}

export default CategoryFilter; 