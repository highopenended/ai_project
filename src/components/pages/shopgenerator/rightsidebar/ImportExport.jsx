import PropTypes from 'prop-types';
import './ImportExport.css';
import { useCallback } from 'react';

function ImportExport({ handleImportShop, handleExportShop }) {
    const handleDrop = useCallback((event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            handleImportShop({ target: { files: [file] } });
        }
    }, [handleImportShop]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);

    return (
        <div className="import-export-section">
            <div 
                className="drag-drop-zone"
                onClick={() => document.getElementById('file-input').click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                aria-label="Drag and drop a shop file here or click to select"
            >
                Drag and drop a shop file here or click to select
            </div>
            <input 
                id="file-input"
                type="file" 
                accept=".shop"
                onChange={handleImportShop}
                aria-label="Import Shop"
                className="file-input"
            />
            <button 
                className="action-button"
                onClick={handleExportShop}
                aria-label="Export Shop"
            >
                Export Shop
            </button>
        </div>
    );
}

ImportExport.propTypes = {
    handleImportShop: PropTypes.func.isRequired,
    handleExportShop: PropTypes.func.isRequired
};

export default ImportExport; 