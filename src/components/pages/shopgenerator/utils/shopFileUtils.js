// Function to export shopData as a .shop file
export function exportShopData(shopData) {
  const jsonData = JSON.stringify(shopData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${shopData.name || 'shop'}.shop`;
  a.click();
  URL.revokeObjectURL(url);
}

// Function to import shopData from a .shop file
export function importShopData(file, callback) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      callback(importedData);
    } catch (error) {
      console.error('Error parsing shop file:', error);
      alert('Invalid shop file. Please check and try again.');
    }
  };
  reader.readAsText(file);
} 