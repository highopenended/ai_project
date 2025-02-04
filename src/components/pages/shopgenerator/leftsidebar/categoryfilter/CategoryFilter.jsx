import { useState } from 'react';
import { useCategoryContext, SELECTION_STATES } from '../../context/CategoryContext';
import './CategoryFilter.css';
import DropdownArrow from '../../components/DropdownArrow';
import SubcategoryFilter from '../subcategoryfilter/SubcategoryFilter';

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

    const getTagClassName = (state) => {
        const baseClass = 'tag';
        if (state === SELECTION_STATES.INCLUDE) return `${baseClass} included`;
        if (state === SELECTION_STATES.EXCLUDE) return `${baseClass} excluded`;
        return baseClass;
    };

    return (
        <div className="category-filter">
            <div className="category-section">
                <div className="section-header">
                    <h3>Categories</h3>
                    <div className="buttons">
                        <button 
                            className="reset-button" 
                            onClick={clearCategorySelections}
                            title="Reset category selections"
                        >
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
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
                        <div className="tag-container">
                            {filteredCategories.map(category => (
                                <button
                                    key={category}
                                    className={getTagClassName(getCategoryState(category))}
                                    onClick={() => toggleCategory(category)}
                                >
                                    {category}
                                    <span className="count">({categoryData[category].count})</span>
                                    {getCategoryState(category) === SELECTION_STATES.EXCLUDE && (
                                        <span className="exclude-indicator">✕</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <SubcategoryFilter />
        </div>
    );
}

export default CategoryFilter; 