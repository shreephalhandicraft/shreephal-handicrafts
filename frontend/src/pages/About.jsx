import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEO/SEOHead";
import { StructuredData } from "@/components/SEO/StructuredData";
import { PAGE_SEO } from "@/config/seoConfig";
import { generateLocalBusinessSchema } from "@/utils/schemaGenerators";

const About = () => {
  // Business information for schema
  const businessInfo = {
    phone: "+91-XXXXXXXXXX", // Update with actual phone
    email: "info@shreephalhandicrafts.com", // Update with actual email
    city: "Narnaund",
    state: "Haryana",
    street: "", // Add if available
  };

  return (
    <Layout>
      {/* SEO Metadata */}
      <SEOHead
        title={PAGE_SEO.about.title}
        description={PAGE_SEO.about.description}
        keywords={PAGE_SEO.about.keywords}
        path={PAGE_SEO.about.path}
        type="website"
      />
      
      {/* Local Business Structured Data */}
      <StructuredData data={generateLocalBusinessSchema(businessInfo)} />

      {/* Page Content */}
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-gray-900">
              About Shreephal Handicrafts
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Welcome to Shreephal Handicrafts, your trusted partner for premium trophies, 
                awards, and handicrafts. We are dedicated to celebrating achievements and 
                creating memorable moments with our high-quality products.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Our Mission</h2>
              <p className="text-gray-700 mb-6">
                To provide exceptional quality trophies and awards that honor achievements 
                and create lasting memories for schools, corporates, sports events, and 
                special occasions across India.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Why Choose Us</h2>
              <ul className="space-y-3 text-gray-700">
                <li>✅ Premium quality materials and craftsmanship</li>
                <li>✅ Fully customizable designs to match your vision</li>
                <li>✅ Fast and reliable delivery across India</li>
                <li>✅ Competitive pricing without compromising quality</li>
                <li>✅ Dedicated customer support team</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Our Commitment</h2>
              <p className="text-gray-700 mb-6">
                We believe every achievement deserves recognition. That's why we put our 
                heart into every trophy, award, and handicraft we create. From concept to 
                delivery, we ensure excellence at every step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;