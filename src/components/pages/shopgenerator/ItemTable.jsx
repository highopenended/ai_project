import PropTypes from 'prop-types';
import './ItemTable.css';
import { RARITY_COLORS } from '../../../constants/rarityColors';

function ItemTable({ items, sortConfig, onSort }) {
    if (!items || items.length === 0) {
        return null;
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

    return (
        <div className="item-table-container">
            <table className="item-table">
                <thead>
                    <tr>
                        {renderColumnHeader('count', 'Count')}
                        {renderColumnHeader('name', 'Item Name')}
                        {renderColumnHeader('rarity', 'Rarity')}
                        {renderColumnHeader('level', 'Level')}
                        {renderColumnHeader('item_category', 'Category')}
                        {renderColumnHeader('item_subcategory', 'Subcategory')}
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
                            <td className="col-price">{item.price}</td>
                            <td className="col-total">{formatGold(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
        })
    ).isRequired,
    sortConfig: PropTypes.arrayOf(
        PropTypes.shape({
            column: PropTypes.string.isRequired,
            direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
        })
    ).isRequired,
    onSort: PropTypes.func.isRequired,
};

export default ItemTable; 