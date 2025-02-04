import PropTypes from 'prop-types';
import ItemTable from '../ItemTable';
import './MiddleBar.css';

function MiddleBar({ items, sortConfig, onSort }) {
    return (
        <div className="middle-bar">
            <ItemTable 
                items={items}
                sortConfig={sortConfig}
                onSort={onSort}
            />
        </div>
    );
}

MiddleBar.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    sortConfig: PropTypes.arrayOf(PropTypes.shape({
        column: PropTypes.string.isRequired,
        direction: PropTypes.oneOf(['asc', 'desc'])
    })).isRequired,
    onSort: PropTypes.func.isRequired
};

export default MiddleBar;
