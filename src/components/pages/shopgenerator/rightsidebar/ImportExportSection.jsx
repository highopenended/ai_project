import PropTypes from 'prop-types';
import Section from '../components/Section';
import ImportExport from './ImportExport';

const ImportExportSection = ({ handleImportShop, handleExportShop }) => {
    return (
        <Section title="Import/Export">
            <ImportExport 
                handleImportShop={handleImportShop} 
                handleExportShop={handleExportShop} 
            />
        </Section>
    );
};

ImportExportSection.propTypes = {
    handleImportShop: PropTypes.func.isRequired,
    handleExportShop: PropTypes.func.isRequired,
};

export default ImportExportSection; 