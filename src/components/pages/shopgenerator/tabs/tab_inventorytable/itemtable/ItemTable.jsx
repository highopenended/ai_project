import PropTypes from 'prop-types';
import './ItemTable.css';
import { RARITY_COLORS } from '../../../../../../constants/rarityColors';

function ItemTable({ items, sortConfig, onSort, currentShopName }) {
    // Helper function to get sort indicator and order
    const getSortInfo = (columnName) => {
        const sortItem = sortConfig.find(item => item.column === columnName);
        if (!sortItem) return { indicator: '', order: 0 };
        
        const order = sortConfig.findIndex(item => item.column === columnName) + 1;
        return {
            indicator: sortItem.direction === 'asc' ? '↑' : '↓',
            order: sortConfig.length > 1 ? order : 0
        };
    };

    // Helper function to render column header with sort indicator
    const renderColumnHeader = (columnName, displayName) => {
        const { indicator, order } = getSortInfo(columnName);
        return (
            <th onClick={() => onSort(columnName)} className={`sortable-header col-${columnName}`}>
                {displayName}
                <span className="sort-indicator">
                    {indicator}
                    {order > 0 && <sup>{order}</sup>}
                </span>
            </th>
        );
    };

    if (!items || items.length === 0) {
        return (
            <div className="item-table-wrapper">
                <div className="item-table-container">
                    <h2 className="shop-title">{currentShopName}</h2>
                    <table className="item-table">
                        <thead>
                            <tr>
                                {renderColumnHeader('count', '#')}
                                {renderColumnHeader('name', 'Item Name')}
                                {renderColumnHeader('rarity', 'Rarity')}
                                {renderColumnHeader('level', 'Level')}
                                {renderColumnHeader('item_category', 'Category')}
                                {renderColumnHeader('item_subcategory', 'Subcategory')}
                                {renderColumnHeader('traits', 'Traits')}
                                {renderColumnHeader('price', 'Price')}
                                {renderColumnHeader('total', 'Total')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="9" className="empty-message">
                                    Click &ldquo;Generate Shop&rdquo; to populate the table with items
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="table-totals">
                    <div className="totals-content">
                        <div className="total-item counts-group">
                            <div className="total-row">
                                <span className="total-label">Items:</span>
                                <span className="total-value">
                                    <span className="count-prefix">×</span>
                                    0
                                </span>
                                <span className="total-label unique-count">(0 unique)</span>
                            </div>
                        </div>
                        <div className="totals-divider" />
                        <div className="total-item">
                            <span className="total-label">Avg Level:</span>
                            <span className="total-value">0.0</span>
                        </div>
                        <div className="total-item">
                            <span className="total-label">Avg Price:</span>
                            <span className="total-value">0.00 gp</span>
                        </div>
                        <div className="total-item">
                            <span className="total-label">Total Value:</span>
                            <span className="total-value">0.00 gp</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Helper function to format gold amount into gp, sp, cp
    const formatGold = (amount) => {
        // Convert to copper pieces first (multiply by 100 to handle 2 decimal places)
        const totalCopper = Math.round(amount * 100);
        
        const gp = Math.floor(totalCopper / 100);
        const sp = Math.floor((totalCopper % 100) / 10);
        const cp = totalCopper % 10;

        const parts = [];
        if (gp > 0) parts.push(`${gp} gp`);
        if (sp > 0) parts.push(`${sp} sp`);
        if (cp > 0) parts.push(`${cp} cp`);
        
        // If amount is 0, return "0 gp"
        return parts.length > 0 ? parts.join(', ') : '0 gp';
    };

    // Helper function to format decimal gold pieces
    const formatDecimalGold = (amount) => {
        const [whole, decimal] = amount.toFixed(2).split('.');
        const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return (
            <>
                {wholeWithCommas}<span className="decimal-part">.{decimal}</span> gp
            </>
        );
    };

    // Calculate totals
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);
    const uniqueCount = items.length;
    const totalPrice = items.reduce((sum, item) => sum + item.total, 0);

    // Calculate averages
    const avgLevel = totalCount > 0 ? 
        items.reduce((sum, item) => sum + (parseInt(item.level) * item.count), 0) / totalCount : 0;
    const avgPrice = totalCount > 0 ? totalPrice / totalCount : 0;

    // Calculate rarity counts
    const rarityCounts = items.reduce((counts, item) => {
        counts[item.rarity] = (counts[item.rarity] || 0) + item.count;
        return counts;
    }, {});

    return (
        <div className="item-table-wrapper">
            <div className="item-table-container">
                <h2 className="shop-title">{currentShopName}</h2>
                <table className="item-table">
                    <thead>
                        <tr>
                            {renderColumnHeader('count', 'Count')}
                            {renderColumnHeader('name', 'Item Name')}
                            {renderColumnHeader('rarity', 'Rarity')}
                            {renderColumnHeader('level', 'Level')}
                            {renderColumnHeader('item_category', 'Category')}
                            {renderColumnHeader('item_subcategory', 'Subcategory')}
                            {renderColumnHeader('traits', 'Traits')}
                            {renderColumnHeader('price', 'Price')}
                            {renderColumnHeader('total', 'Total')}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={`${item.url}-${index}`}>
                                <td className="col-count">
                                    <span className="count-prefix">×</span>
                                    {item.count}
                                </td>
                                <td className="col-name">{item.name}</td>
                                <td className="col-rarity" style={{ color: RARITY_COLORS[item.rarity] }}>{item.rarity}</td>
                                <td className="col-level">{item.level}</td>
                                <td className="col-category">{item.item_category}</td>
                                <td className="col-subcategory">{item.item_subcategory}</td>
                                <td className="col-traits">
                                    {item.traits?.map((trait, i) => (
                                        <span key={trait} className="trait-tag">
                                            {trait}{i < item.traits.length - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </td>
                                <td className="col-price">{item.price}</td>
                                <td className="col-total">{formatGold(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="table-totals">
                <div className="totals-content">
                    <div className="total-item counts-group">
                        <div className="total-row">
                            <span className="total-label">Items:</span>
                            <span className="total-value">
                                <span className="count-prefix">×</span>
                                {totalCount}
                            </span>
                            <span className="total-label unique-count">({uniqueCount} unique)</span>
                        </div>
                        <div className="rarity-count-list">
                            {Object.entries(RARITY_COLORS)
                                .filter(([rarity]) => (rarityCounts[rarity] || 0) > 0)
                                .map(([rarity, color], index, filteredArray) => (
                                    <span key={rarity} className="rarity-count" style={{ color }}>
                                        {rarity}: {rarityCounts[rarity]}
                                        {index < filteredArray.length - 1 && <span className="rarity-separator" />}
                                    </span>
                                ))}
                        </div>
                    </div>
                    <div className="totals-divider" />
                    <div className="total-item">
                        <span className="total-label">Avg Level:</span>
                        <span className="total-value">{avgLevel.toFixed(1)}</span>
                    </div>
                    <div className="total-item">
                        <span className="total-label">Avg Price:</span>
                        <span className="total-value">{formatDecimalGold(avgPrice)}</span>
                    </div>
                    <div className="total-item">
                        <span className="total-label">Total Value:</span>
                        <span className="total-value">{formatDecimalGold(totalPrice)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

ItemTable.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            level: PropTypes.string.isRequired,
            price: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired,
            total: PropTypes.number.isRequired,
            url: PropTypes.string.isRequired,
            item_category: PropTypes.string.isRequired,
            item_subcategory: PropTypes.string,
            traits: PropTypes.arrayOf(PropTypes.string),
        })
    ).isRequired,
    sortConfig: PropTypes.arrayOf(
        PropTypes.shape({
            column: PropTypes.string.isRequired,
            direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
        })
    ).isRequired,
    onSort: PropTypes.func.isRequired,
    currentShopName: PropTypes.string.isRequired,
};

export default ItemTable; 