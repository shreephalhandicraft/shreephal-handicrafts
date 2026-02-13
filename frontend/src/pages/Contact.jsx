import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { StructuredData } from "@/components/SEO/StructuredData";
import { PAGE_SEO } from "@/config/seoConfig";
import { generateLocalBusinessSchema } from "@/utils/schemaGenerators";

const Contact = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact" },
  ];

  const businessInfo = {
    phone: "+919424626008",
    email: "shreephalhandicraft@gmail.com",
    city: "Lordganj, Jabalpur",
    state: "Madhya Pradesh",
    street: "Main Road, Kachiyana",
  };

  return (
    <Layout>
      {/* SEO */}
      <SEOHead {...PAGE_SEO.contact} />
      <OpenGraphTags {...PAGE_SEO.contact} type="website" />
      <BreadcrumbSchema items={breadcrumbs} />
      <StructuredData data={generateLocalBusinessSchema(businessInfo)} />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">Get In Touch</h1>
            <p className="text-center text-gray-600 mb-12 text-lg">Have questions? We'd love to hear from you. Send us a message!</p>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><Phone className="h-6 w-6 text-primary" /></div>
                    <div><h3 className="font-semibold text-gray-900 mb-1">Phone</h3><p className="text-gray-600"><a href="tel:+919424626008" className="hover:text-primary">+91 9424626008</a></p></div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><Mail className="h-6 w-6 text-primary" /></div>
                    <div><h3 className="font-semibold text-gray-900 mb-1">Email</h3><p className="text-gray-600"><a href="mailto:shreephalhandicraft@gmail.com" className="hover:text-primary">shreephalhandicraft@gmail.com</a></p></div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><MapPin className="h-6 w-6 text-primary" /></div>
                    <div><h3 className="font-semibold text-gray-900 mb-1">Location</h3><p className="text-gray-600">Main Road, Kachiyana<br />Lordganj, Jabalpur<br />Madhya Pradesh - 482002, India</p></div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-primary/5 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Business Hours</h3>
                  <p className="text-gray-600">Monday - Saturday: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Sunday: Closed</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Send Us a Message</h2>
                <form className="space-y-4">
                  <div><Input placeholder="Your Name" /></div>
                  <div><Input type="email" placeholder="Your Email" /></div>
                  <div><Input placeholder="Subject" /></div>
                  <div><Textarea placeholder="Your Message" rows={5} /></div>
                  <Button type="submit" className="w-full">Send Message</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
