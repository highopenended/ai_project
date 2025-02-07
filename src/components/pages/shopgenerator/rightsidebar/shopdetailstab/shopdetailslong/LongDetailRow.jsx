import PropTypes from 'prop-types';
import './LongDetailRow.css';

const LongDetailRow = ({ title, value, onChange, name, placeholder }) => {
    return (
        <div className="long-detail-block">
            <div className="long-detail-header">
                <span className="long-detail-title">{title}</span>
            </div>
            <textarea
                className="long-detail-input"
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                aria-label={title}
            />
        </div>
    );
};

LongDetailRow.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
};

export default LongDetailRow; 