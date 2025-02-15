// import React from 'react';
import './Tab_InventoryTable.css';
import GenerateButton from '../tab_inventorytable/generatebutton/GenerateButton';
import ItemTable from '../tab_inventorytable/itemtable/ItemTable';
import ItemTableTotals from '../tab_inventorytable/itemtable/ItemTableTotals';
import CurrentShopSummary from '../tab_inventorytable/currentshopsummary/currentshopsummary';
import PropTypes from 'prop-types';

function Tab_InventoryTable({ items, sortConfig, onSort, currentShopName, handleGenerateClick }) {
    // Calculate totals
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);
    const uniqueCount = items.length;
    const totalPrice = items.reduce((sum, item) => sum + item.total, 0);

    // Calculate averages
    const avgLevel = totalCount > 0 
        ? items.reduce((sum, item) => sum + parseInt(item.level) * item.count, 0) / totalCount 
        : 0;
    const avgPrice = totalCount > 0 ? totalPrice / totalCount : 0;

    // Calculate rarity counts
    const rarityCounts = items.reduce((counts, item) => {
        counts[item.rarity] = (counts[item.rarity] || 0) + item.count;
        return counts;
    }, {});

    return (
        <div className="main-wrapper-inventory-table">
            <CurrentShopSummary currentShopName={currentShopName} />
            <GenerateButton onClick={handleGenerateClick} />
            <ItemTable
                items={items}
                sortConfig={sortConfig}
                onSort={onSort}
            />
            <ItemTableTotals
                totalCount={totalCount}
                uniqueCount={uniqueCount}
                rarityCounts={rarityCounts}
                avgLevel={avgLevel}
                avgPrice={avgPrice}
                totalPrice={totalPrice}
            />
        </div>
    );
}

Tab_InventoryTable.propTypes = {
    items: PropTypes.array.isRequired,
    sortConfig: PropTypes.array.isRequired,
    onSort: PropTypes.func.isRequired,
    currentShopName: PropTypes.string.isRequired,
    handleGenerateClick: PropTypes.func.isRequired,
};

Tab_InventoryTable.displayName = "Inventory Table";
Tab_InventoryTable.minWidth = 400;
Tab_InventoryTable.additionalClassNames = "no-scrollbar";

export default Tab_InventoryTable;
