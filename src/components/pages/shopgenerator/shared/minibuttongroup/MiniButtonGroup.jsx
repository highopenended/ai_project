import ResetMiniButton from './ResetMiniButton';
import CollapseExpandMiniButton from './CollapseExpandMiniButton';
import PropTypes from 'prop-types';

export default function MiniButtonGroup({ handleReset, isCollapsed, setIsCollapsed }) {
    return (
        <div className="buttons">
            {handleReset && <ResetMiniButton onClick={handleReset} title="Reset Values" />}
            <CollapseExpandMiniButton isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        </div>
    );
}

MiniButtonGroup.propTypes = {
    handleReset: PropTypes.func,
    isCollapsed: PropTypes.bool,
    setIsCollapsed: PropTypes.func,
};