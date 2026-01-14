/**
 * FAQ Schema for SEO
 * Shows FAQ accordion in Google search results
 */

import { Helmet } from 'react-helmet-async';

export const FAQSchema = ({ faqs }) => {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
  );
};

/**
 * Usage Example:
 * 
 * <FAQSchema 
 *   faqs={[
 *     {
 *       question: 'Do you ship internationally?',
 *       answer: 'Yes, we ship to over 50 countries worldwide.'
 *     },
 *     {
 *       question: 'What is your return policy?',
 *       answer: 'We offer 30-day returns on all products.'
 *     }
 *   ]}
 * />
 */
