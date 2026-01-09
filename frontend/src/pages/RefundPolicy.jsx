import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEO/SEOHead";
import { PAGE_SEO } from "@/config/seoConfig";

const RefundPolicy = () => {
  return (
    <Layout>
      <SEOHead
        title={PAGE_SEO.refundPolicy.title}
        description={PAGE_SEO.refundPolicy.description}
        keywords={PAGE_SEO.refundPolicy.keywords}
        path={PAGE_SEO.refundPolicy.path}
      />
      
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h1 className="text-4xl font-bold mb-8">Refund & Return Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>Our Commitment</h2>
            <p>
              At Shreephal Handicrafts, we are committed to your satisfaction. If you're 
              not completely happy with your purchase, we're here to help.
            </p>
            
            <h2>Return Period</h2>
            <p>
              You have 7 days from the date of delivery to return an item. To be eligible 
              for a return, your item must be unused and in the same condition that you received it.
            </p>
            
            <h2>Refund Process</h2>
            <p>
              Once we receive your returned item, we will inspect it and notify you of the 
              approval or rejection of your refund. If approved, your refund will be 
              processed within 7-10 business days.
            </p>
            
            <h2>Non-Returnable Items</h2>
            <ul>
              <li>Customized or personalized products</li>
              <li>Items marked as final sale</li>
              <li>Products damaged due to misuse</li>
            </ul>
            
            <h2>Contact Us</h2>
            <p>
              For return requests or questions, please contact us at 
              info@shreephalhandicrafts.com
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;