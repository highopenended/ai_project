import PropTypes from "prop-types";
import './ShortDetailBlock.css';

const ShortDetailBlock = ({ title, value, onChange, name }) => {
    return (
        <div className="short-detail-block">
            <span className="short-detail-title">{title}</span>
            <input
                className="short-detail-input"
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={`Enter ${title.toLowerCase()}`}
                autoComplete="off"
            />
        </div>

    );
};

ShortDetailBlock.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
};

export default ShortDetailBlock; 