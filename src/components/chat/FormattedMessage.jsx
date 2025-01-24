import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

function FormattedMessage({ content, role }) {
    const formatContent = (text) => {
        if (role === 'user') return text;

        // Configure marked for safe and limited markdown
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });

        // Convert markdown to HTML and sanitize
        const rawHtml = marked(text);
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'hr'],
            ALLOWED_ATTR: []
        });

        return cleanHtml;
    };

    return (
        <div 
            className={`message ${role === 'user' ? 'user-message' : 'assistant-message'}`}
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
        />
    );
}

FormattedMessage.propTypes = {
    content: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['user', 'assistant']).isRequired
};

export default FormattedMessage; 