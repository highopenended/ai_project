// import React from 'react';
import ItemTable from './tab_inventorytable/itemtable/ItemTable';
import './Tab_InventoryTable.css';
import PropTypes from 'prop-types';
import GenerateButton from './tab_inventorytable/generatebutton/GenerateButton';




Tab_InventoryTable.displayName = "Inventory Table";
Tab_InventoryTable.minWidth = 400;

function Tab_InventoryTable({ items, sortConfig, onSort, currentShop, handleGenerateClick }) {
    return (
        <div>
            <GenerateButton onClick={handleGenerateClick} />
            <ItemTable
                items={items}
                sortConfig={sortConfig}
                onSort={onSort}
                currentShop={currentShop || "Unnamed Shop"}
            />
        </div>
    );
}

Tab_InventoryTable.propTypes = {
    items: PropTypes.array.isRequired,
    sortConfig: PropTypes.object.isRequired,
    onSort: PropTypes.func.isRequired,
    currentShop: PropTypes.string,
    handleGenerateClick: PropTypes.func.isRequired,
};
export default Tab_InventoryTable;
