import { useState } from 'react';
import { useCategoryContext, SELECTION_STATES } from '../../context/CategoryContext';
import './CategoryFilter.css';

function CategoryFilter() {
    const {
        categoryData,
        getCategoryState,
        getSubcategoryState,
        toggleCategory,
        toggleSubcategory,
        clearCategorySelections,
        clearSubcategorySelections
    } = useCategoryContext();

    const [categoryFilter, setCategoryFilter] = useState('');
    const [subcategoryFilter, setSubcategoryFilter] = useState('');
    const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);
    const [isSubcategoryCollapsed, setIsSubcategoryCollapsed] = useState(false);

    // Filter categories based on search
    const filteredCategories = Object.keys(categoryData)
        .filter(category => 
            category.toLowerCase().includes(categoryFilter.toLowerCase())
        )
        .sort();

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
                        <button
                            className={`collapse-button ${isCategoryCollapsed ? 'collapsed' : ''}`}
                            onClick={() => setIsCategoryCollapsed(!isCategoryCollapsed)}
                            title={isCategoryCollapsed ? "Expand categories" : "Collapse categories"}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 10l5 5 5-5H7z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
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

            <div className="subcategory-section">
                <div className="section-header">
                    <h3>Subcategories</h3>
                    <div className="buttons">
                        <button 
                            className="reset-button" 
                            onClick={clearSubcategorySelections}
                            title="Reset subcategory selections"
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
                        <button
                            className={`collapse-button ${isSubcategoryCollapsed ? 'collapsed' : ''}`}
                            onClick={() => setIsSubcategoryCollapsed(!isSubcategoryCollapsed)}
                            title={isSubcategoryCollapsed ? "Expand subcategories" : "Collapse subcategories"}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 10l5 5 5-5H7z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
                {!isSubcategoryCollapsed && (
                    <>
                        <input
                            type="text"
                            placeholder="Search subcategories..."
                            value={subcategoryFilter}
                            onChange={(e) => setSubcategoryFilter(e.target.value)}
                            className="search-input"
                        />
                        <div className="tag-container">
                            {filteredSubcategories.map(subcategory => (
                                <button
                                    key={subcategory}
                                    className={getTagClassName(getSubcategoryState(subcategory))}
                                    onClick={() => toggleSubcategory(subcategory)}
                                >
                                    {subcategory}
                                    {getSubcategoryState(subcategory) === SELECTION_STATES.EXCLUDE && (
                                        <span className="exclude-indicator">✕</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CategoryFilter; 