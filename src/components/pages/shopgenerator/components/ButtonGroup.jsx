import ResetButton from './ResetButton';
import CollapseExpandButton from './CollapseExpandButton';
import PropTypes from 'prop-types';



export default function ButtonGroup({ handleReset, isCollapsed, setIsCollapsed }) {
    return (
        <div className="buttons">
            <ResetButton onClick={handleReset} title="Reset Values" />
            <CollapseExpandButton isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        </div>
    );
}


ButtonGroup.propTypes = {
    handleReset: PropTypes.func,
    isCollapsed: PropTypes.bool,
    setIsCollapsed: PropTypes.func,
};