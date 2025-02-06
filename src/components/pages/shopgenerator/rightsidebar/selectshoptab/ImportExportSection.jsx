import PropTypes from 'prop-types';
import './ImportExport.css';
import { useCallback } from 'react';
import Section from '../../components/Section';

const ImportExportSection = ({ handleImportShop, handleExportShop }) => {
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
        <Section title="Import/Export">
            <div className="import-export-wrapper">
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
                        <small className="small-text">-- or --</small>
                        <br />
                        Select File
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
            </div>
        </Section>
    );
};

ImportExportSection.propTypes = {
    handleImportShop: PropTypes.func.isRequired,
    handleExportShop: PropTypes.func.isRequired,
};

export default ImportExportSection; 