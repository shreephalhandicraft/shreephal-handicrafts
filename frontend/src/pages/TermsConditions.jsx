import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEO/SEOHead";
import { PAGE_SEO } from "@/config/seoConfig";

const TermsConditions = () => {
  return (
    <Layout>
      <SEOHead
        title={PAGE_SEO.termsConditions.title}
        description={PAGE_SEO.termsConditions.description}
        keywords={PAGE_SEO.termsConditions.keywords}
        path={PAGE_SEO.termsConditions.path}
      />
      
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>Agreement to Terms</h2>
            <p>
              By accessing and using Shreephal Handicrafts website, you agree to be bound 
              by these Terms and Conditions and all applicable laws and regulations.
            </p>
            
            <h2>Use of Website</h2>
            <p>You agree to use this website only for lawful purposes and in accordance with these Terms.</p>
            
            <h2>Products and Services</h2>
            <p>
              We strive to provide accurate product descriptions and pricing. However, 
              we reserve the right to correct errors and update information without prior notice.
            </p>
            
            <h2>Orders and Payment</h2>
            <p>
              All orders are subject to acceptance and availability. We reserve the right 
              to refuse or cancel any order for any reason.
            </p>
            
            <h2>Limitation of Liability</h2>
            <p>
              Shreephal Handicrafts shall not be liable for any indirect, incidental, or 
              consequential damages arising from the use of our website or products.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;