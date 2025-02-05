import PropTypes from 'prop-types';
import './ImportExport.css';
import { useCallback, useState } from 'react';
import CollapseExpandButton from '../components/CollapseExpandButton';
import Section from '../components/Section';
import ButtonGroup from '../components/ButtonGroup';

function ImportExport({ handleImportShop, handleExportShop }) {
    const [isCollapsed, setIsCollapsed] = useState(false);


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

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="import-export-wrapper">
            {/* <div className="import-export-header">
                <h3>Import/Export</h3>
                <CollapseExpandButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
            </div>
            <Section
                title="Import/Export"
                buttonGroup={
                    <ButtonGroup isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                }
            >
            {!isCollapsed && (
                <div className="import-export-section">
                    <div 
                        className="drag-drop-zone"
                        onClick={() => document.getElementById('file-input').click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        aria-label="Drag and drop or Select File"
                    >
                        Drag and drop or Select File
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
            )}
            </Section> */}
        </div>
    );
}

ImportExport.propTypes = {
    handleImportShop: PropTypes.func.isRequired,
    handleExportShop: PropTypes.func.isRequired
};

export default ImportExport; 