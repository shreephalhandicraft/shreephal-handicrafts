import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEO/SEOHead";
import { PAGE_SEO } from "@/config/seoConfig";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <SEOHead
        title={PAGE_SEO.privacyPolicy.title}
        description={PAGE_SEO.privacyPolicy.description}
        keywords={PAGE_SEO.privacyPolicy.keywords}
        path={PAGE_SEO.privacyPolicy.path}
      />
      
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>Introduction</h2>
            <p>
              Shreephal Handicrafts respects your privacy and is committed to protecting 
              your personal information. This Privacy Policy explains how we collect, use, 
              and safeguard your data.
            </p>
            
            <h2>Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Name and contact information</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information</li>
              <li>Order history and preferences</li>
            </ul>
            
            <h2>How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about products and services</li>
              <li>Improve our website and customer experience</li>
              <li>Comply with legal obligations</li>
            </ul>
            
            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at 
              info@shreephalhandicrafts.com
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;