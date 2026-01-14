import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * StructuredData Component
 * 
 * Injects JSON-LD structured data into the page head.
 * Used for Schema.org markup to help search engines understand content.
 * 
 * @param {Object} props
 * @param {Object|Array} props.data - Schema.org structured data object(s)
 */
export const StructuredData = ({ data }) => {
  // Handle both single schema object and array of schemas
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

StructuredData.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]).isRequired
};
