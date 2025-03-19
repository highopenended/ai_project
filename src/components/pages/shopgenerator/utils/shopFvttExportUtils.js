import fvttItemData from "../../../../data/fvtt-Item-pack-pf2e-equipment-srd.json";

/**
 * Creates a lookup map for FVTT items by name for quick reference
 * @returns {Map} A map of FVTT items with name as key
 */
const createFvttItemMap = () => {
  const map = new Map();
  if (!fvttItemData?.items || !Array.isArray(fvttItemData.items)) {
    console.error("Invalid FVTT item data format");
    return map;
  }
  
  fvttItemData.items.forEach(item => {
    map.set(item.name.toLowerCase(), item);
  });
  
  return map;
};

/**
 * Exports the current shop in Foundry VTT Actor format
 * @param {Object} shopData - The shop data to export
 * @param {Array} inventory - The current inventory of the shop
 * @param {Object} shopSnapshot - Optional shop snapshot to use for inventory
 * @returns {void}
 */
export function exportShopToFvtt(shopData, inventory, shopSnapshot = null) {
  try {
    // Determine the inventory to use
    // 1. Use the provided inventory directly if no snapshot exists
    // 2. Use the snapshot's inventory if it exists (most up-to-date state)
    // 3. Fallback to the provided inventory
    const itemsToExport = shopSnapshot?.currentStock || inventory || [];

    console.log(`Exporting shop with ${itemsToExport.length} items from ${shopSnapshot ? 'snapshot' : 'current inventory'}`);
    
    // Create the FVTT item map for lookup
    const fvttItemMap = createFvttItemMap();
    
    // Build the items array from inventory
    const fvttItems = itemsToExport
      .map(item => {
        // Look up the original FVTT item by name
        const fvttItem = fvttItemMap.get(item.name.toLowerCase());
        if (!fvttItem) {
          console.warn(`Item not found in FVTT data: ${item.name}`);
        }
        return fvttItem || null; // Return null for items not found
      })
      .filter(item => item !== null); // Filter out any null items
    
    console.log(`Found ${fvttItems.length} matching FVTT items to export`);
    
    // Create the export object with the FVTT format
    const exportData = {
      "prototypeToken": {
        "displayName": 20,
        "displayBars": 20,
        "flags": {
          "pf2e": {
            "linkToActorSize": false,
            "autoscale": false
          }
        },
        "height": 1,
        "width": 1,
        "actorLink": true,
        "sight": {
          "enabled": false,
          "range": 0,
          "angle": 360,
          "visionMode": "basic",
          "color": null,
          "attenuation": 0.1,
          "brightness": 0,
          "saturation": 0,
          "contrast": 0
        },
        "name": shopData.name,
        "appendNumber": false,
        "prependAdjective": false,
        "texture": {
          "src": "systems/pf2e/icons/default-icons/mystery-man.svg",
          "scaleX": 1,
          "scaleY": 1,
          "offsetX": 0,
          "offsetY": 0,
          "rotation": 0,
          "anchorX": 0.5,
          "anchorY": 0.5,
          "fit": "contain",
          "tint": "#ffffff",
          "alphaThreshold": 0.75
        },
        "lockRotation": false,
        "rotation": 0,
        "alpha": 1,
        "disposition": -1,
        "bar1": {
          "attribute": "attributes.hp"
        },
        "bar2": {
          "attribute": null
        },
        "light": {
          "alpha": 0.5,
          "angle": 360,
          "bright": 0,
          "coloration": 1,
          "dim": 0,
          "attenuation": 0.5,
          "luminosity": 0.5,
          "saturation": 0,
          "contrast": 0,
          "shadows": 0,
          "animation": {
            "type": null,
            "speed": 5,
            "intensity": 5,
            "reverse": false
          },
          "darkness": {
            "min": 0,
            "max": 1
          },
          "negative": false,
          "priority": 0,
          "color": null
        },
        "detectionModes": [],
        "randomImg": false,
        "hexagonalShape": 0,
        "occludable": {
          "radius": 0
        },
        "ring": {
          "enabled": false,
          "colors": {
            "ring": null,
            "background": null
          },
          "effects": 1,
          "subject": {
            "scale": 1,
            "texture": null
          }
        }
      },
      "folder": "5MLFrMqUonqpxCVs",
      "name": shopData.name,
      "type": "loot",
      "effects": [],
      "system": {
        "details": {
          "description": "",
          "level": {
            "value": 0
          }
        },
        "lootSheetType": "Merchant",
        "hiddenWhenEmpty": false,
        "_migration": {
          "version": 0.935,
          "previous": {
            "schema": 0.926,
            "foundry": "12.331",
            "system": "6.10.2"
          }
        }
      },
      "img": "oldman.webp",
      "items": fvttItems,
      "flags": {
        "exportSource": {
          "world": "test",
          "system": "pf2e",
          "coreVersion": "12.331",
          "systemVersion": "6.10.2"
        }
      },
      "_stats": {
        "coreVersion": "12.331",
        "systemId": "pf2e",
        "systemVersion": "6.10.2",
        "createdTime": Date.now(),
        "modifiedTime": Date.now(),
        "lastModifiedBy": "Bbg4DPw4rsJmZa1a"
      }
    };
    
    // Create and download the JSON file
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Format the filename as "fvtt-Actor-{shopname}-{randomId}"
    const cleanShopName = shopData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 10);
    a.download = `fvtt-Actor-${cleanShopName}-${randomId}.json`;
    
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting shop to Foundry VTT format:", error);
    alert("Error exporting shop to Foundry VTT format. Please try again.");
  }
} 