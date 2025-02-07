import PropTypes from "prop-types";
import './ShortDetailRow.css';

const ShortDetailRow = ({ title, value, onChange, name }) => {
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

ShortDetailRow.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
};

export default ShortDetailRow; 