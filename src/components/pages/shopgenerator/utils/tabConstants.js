import Tab_Parameters from "../tabs/tab_parameters/Tab_Parameters";
import Tab_InventoryTable from "../tabs/tab_inventorytable/Tab_InventoryTable";
import Tab_ChooseShop from "../tabs/tab_chooseshop/Tab_ChooseShop";
import Tab_ShopDetails from "../tabs/tab_shopdetails/Tab_ShopDetails";
import Tab_AiAssistant from "../tabs/tab_aiassistant/Tab_AiAssistant";

export const TAB_TYPE_IDENTIFIERS = {
    PARAMETERS: "Tab_Parameters",
    INVENTORY: "Tab_InventoryTable",
    CHOOSE_SHOP: "Tab_ChooseShop",
    SHOP_DETAILS: "Tab_ShopDetails",
    AI_ASSISTANT: "Tab_AiAssistant",
};

export const TAB_TYPES = {
    [TAB_TYPE_IDENTIFIERS.PARAMETERS]: Tab_Parameters,
    [TAB_TYPE_IDENTIFIERS.INVENTORY]: Tab_InventoryTable,
    [TAB_TYPE_IDENTIFIERS.CHOOSE_SHOP]: Tab_ChooseShop,
    [TAB_TYPE_IDENTIFIERS.SHOP_DETAILS]: Tab_ShopDetails,
    [TAB_TYPE_IDENTIFIERS.AI_ASSISTANT]: Tab_AiAssistant,
};

export const DEFAULT_TAB_STATE = {
    groups: [
        [{ type: TAB_TYPE_IDENTIFIERS.PARAMETERS, key: "Tab_Parameters-0" }],
        [{ type: TAB_TYPE_IDENTIFIERS.INVENTORY, key: "Tab_InventoryTable-0" }],
        [{ type: TAB_TYPE_IDENTIFIERS.CHOOSE_SHOP, key: "Tab_ChooseShop-0" }],
        [
            { type: TAB_TYPE_IDENTIFIERS.SHOP_DETAILS, key: "Tab_ShopDetails-0" },
            { type: TAB_TYPE_IDENTIFIERS.AI_ASSISTANT, key: "Tab_AiAssistant-0" }]
    ],
    widths: ["10%", "50%", "10%", "30%", "10%"]
}; 