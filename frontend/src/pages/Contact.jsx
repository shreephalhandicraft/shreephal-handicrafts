import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEO/SEOHead";
import { StructuredData } from "@/components/SEO/StructuredData";
import { PAGE_SEO } from "@/config/seoConfig";
import { generateLocalBusinessSchema } from "@/utils/schemaGenerators";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  const businessInfo = {
    phone: "+91-XXXXXXXXXX",
    email: "info@shreephalhandicrafts.com",
    city: "Narnaund",
    state: "Haryana",
    street: "",
  };

  return (
    <Layout>
      {/* SEO Metadata */}
      <SEOHead
        title={PAGE_SEO.contact.title}
        description={PAGE_SEO.contact.description}
        keywords={PAGE_SEO.contact.keywords}
        path={PAGE_SEO.contact.path}
        type="website"
      />
      
      {/* Local Business Schema */}
      <StructuredData data={generateLocalBusinessSchema(businessInfo)} />

      {/* Page Content */}
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">
              Contact Us
            </h1>
            <p className="text-center text-lg text-gray-600 mb-12">
              Get in touch with us for custom orders, bulk inquiries, or any questions
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Phone</h3>
                <p className="text-gray-600">+91-XXXXXXXXXX</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-gray-600">info@shreephalhandicrafts.com</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Location</h3>
                <p className="text-gray-600">Narnaund, Haryana, India</p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea rows="4" className="w-full px-4 py-2 border rounded-lg"></textarea>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;