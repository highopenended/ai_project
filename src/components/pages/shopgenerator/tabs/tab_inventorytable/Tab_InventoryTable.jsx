// import React from 'react';
import './Tab_InventoryTable.css';
import ItemTable from '../tab_inventorytable/itemtable/ItemTable';
import GenerateButton from '../tab_inventorytable/generatebutton/GenerateButton';
import PropTypes from 'prop-types';

Tab_InventoryTable.displayName = "Inventory Table";
Tab_InventoryTable.minWidth = 400;
Tab_InventoryTable.additionalClassNames = "no-scrollbar";

function Tab_InventoryTable({ items, sortConfig, onSort, currentShopName, handleGenerateClick }) {
    return (
        <div>
            <GenerateButton onClick={handleGenerateClick} />
            <ItemTable
                items={items}
                sortConfig={sortConfig}
                onSort={onSort}
                currentShopName={currentShopName}
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
export default Tab_InventoryTable;
