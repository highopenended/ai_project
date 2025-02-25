export const TAB_TYPE_IDENTIFIERS = {
    PARAMETERS: "Tab_Parameters",
    INVENTORY: "Tab_InventoryTable",
    CHOOSE_SHOP: "Tab_ChooseShop",
    SHOP_DETAILS: "Tab_ShopDetails",
};

export const DEFAULT_TAB_STATE = {
    groups: [
        [{ type: TAB_TYPE_IDENTIFIERS.PARAMETERS, key: "Tab_Parameters-0" }],
        [{ type: TAB_TYPE_IDENTIFIERS.INVENTORY, key: "Tab_InventoryTable-0" }],
        [{ type: TAB_TYPE_IDENTIFIERS.CHOOSE_SHOP, key: "Tab_ChooseShop-0" }],
        [{ type: TAB_TYPE_IDENTIFIERS.SHOP_DETAILS, key: "Tab_ShopDetails-0" }]
    ],
    widths: ["10%", "55%", "10%", "20%"]
}; 