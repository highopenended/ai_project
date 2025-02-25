import PropTypes from 'prop-types';
import './ImportExport.css';
import { useCallback } from 'react';
import { importShopData } from '../../../utils/shopFileUtils';

const ImportExport = ({ handleImportShop, handleExportShop: exportShop, shopData }) => {
    const handleImport = useCallback((importedData) => {
        // Strip the ID from imported data to ensure a new one is generated
        const { id, ...dataWithoutId } = importedData;
        handleImportShop(dataWithoutId);
    }, [handleImportShop]);

    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        if (file) {
            importShopData(file, handleImport);
        }
    }, [handleImport]);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            importShopData(file, handleImport);
        }
    }, [handleImport]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);

    return (
        <div className="import-export-container">
            <div className="import-export-title">Import/Export</div>
            <div className="import-export-section">
                <div 
                    className="drag-drop-zone"
                    onClick={() => document.getElementById('file-input').click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    aria-label="Drag and drop or Select File"
                >
                    Drag and drop
                    <br />
                    <span className="small-text">-- or --</span>
                    <br />
                    Select File
                </div>
                <input 
                    id="file-input"
                    type="file" 
                    accept=".shop"
                    onChange={handleFileChange}
                    aria-label="Import Shop"
                    className="file-input"
                />
                <button 
                    className="action-button"
                    onClick={() => exportShop(shopData)}
                    aria-label="Export Shop"
                >
                    Export Shop
                </button>
            </div>
        </div>
    );
};

ImportExport.propTypes = {
    handleImportShop: PropTypes.func.isRequired,
    handleExportShop: PropTypes.func.isRequired,
    shopData: PropTypes.object.isRequired,
};

export default ImportExport; 