import { Layout } from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { PAGE_SEO } from "@/config/seoConfig";
import { Link } from "react-router-dom";
import { Clock, AlertCircle } from "lucide-react";

const TermsConditions = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Terms & Conditions", url: "/terms-conditions" },
  ];

  return (
    <Layout>
      <SEOHead {...PAGE_SEO.termsConditions} />
      <OpenGraphTags {...PAGE_SEO.termsConditions} type="website" />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Terms & Conditions</h1>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">Last updated: February 2026</p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using the Shreephal Handicrafts website and placing an order, you accept and agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use our website or services.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Products and Services</h2>
              <p className="mb-4">
                All products displayed on our website are subject to availability. We specialize in handcrafted trophies, mementos, photo frames, key holders, and customized gifts. We reserve the right to discontinue any product at any time without prior notice.
              </p>
              <p className="mb-4">
                Product images are for illustration purposes only. Actual products may vary slightly due to the handcrafted nature of our items.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">3. Pricing</h2>
              <p className="mb-4">
                All prices are listed in Indian Rupees (INR) and include applicable GST. Prices are subject to change without notice. While we strive to ensure accuracy in pricing, errors may occur. If an error is discovered, we will contact you to confirm the correct price before processing your order.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Orders and Payment</h2>
              <p className="mb-4">
                We reserve the right to refuse or cancel any order for any reason, including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Product availability</li>
                <li>Errors in pricing or product information</li>
                <li>Suspected fraudulent activity</li>
                <li>Payment verification issues</li>
              </ul>
              <p className="mb-4">
                Payment must be completed at the time of order placement. We accept various payment methods including credit/debit cards, UPI, and online banking through our secure payment gateway.
              </p>

              {/* Important Cancellation Policy Notice */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-orange-900 mb-2">5. Cancellation Policy - IMPORTANT</h3>
                    <p className="text-orange-800 mb-3">
                      You may cancel your order <strong>within 24 hours of placing it</strong> by calling us at <a href="tel:+919424626008" className="font-bold hover:underline">+91 9424626008</a>.
                    </p>
                    <p className="text-orange-800">
                      After the 24-hour window has expired, orders cannot be cancelled as production may have already begun.
                    </p>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">6. Returns and Refunds</h2>
              <p className="mb-4">
                <strong className="text-red-600">We do not accept returns or exchanges on any products.</strong> All sales are final once the 24-hour cancellation period has expired. This policy applies to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>All standard products</li>
                <li>Customized and personalized products</li>
                <li>Products made to customer specifications</li>
              </ul>
              <p className="mb-4">
                For damaged or defective products, please refer to our <Link to="/refund-policy" className="text-primary hover:underline font-semibold">Refund Policy</Link> for information on how to report and resolve such issues.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">7. Customization Orders</h2>
              <p className="mb-4">
                For customized products:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Please review all customization details carefully before placing your order</li>
                <li>Customized products are made according to your exact specifications</li>
                <li>We are not responsible for errors in customer-provided information</li>
                <li>Customized products cannot be returned or exchanged</li>
                <li>Production begins immediately after the 24-hour cancellation window</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">8. Shipping and Delivery</h2>
              <p className="mb-4">
                Delivery timeframes are estimates and may vary. We are not responsible for delays caused by courier services or unforeseen circumstances. Please ensure your shipping address is correct as we cannot be held responsible for orders delivered to incorrect addresses provided by the customer.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">9. Intellectual Property</h2>
              <p className="mb-4">
                All content on this website, including but not limited to images, text, logos, and designs, is the property of Shreephal Handicrafts and is protected by copyright laws. Unauthorized use is prohibited.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">10. Limitation of Liability</h2>
              <p className="mb-4">
                Shreephal Handicrafts shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our liability is limited to the purchase price of the product.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">11. Privacy</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our <Link to="/privacy-policy" className="text-primary hover:underline font-semibold">Privacy Policy</Link> to understand how we collect, use, and protect your personal information.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">12. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms and conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after changes are posted constitutes acceptance of the modified terms.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">13. Governing Law</h2>
              <p className="mb-4">
                These terms and conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Jabalpur, Madhya Pradesh.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">14. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these terms and conditions, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="mb-2"><strong>Shreephal Handicrafts</strong></p>
                <p className="mb-2">Main Road, Kachiyana, Lordganj</p>
                <p className="mb-2">Jabalpur, Madhya Pradesh, India</p>
                <p className="mb-2">Phone: <a href="tel:+919424626008" className="text-primary hover:underline">+91 9424626008</a></p>
                <p className="mb-2">Email: <a href="mailto:shreephalhandicraft@gmail.com" className="text-primary hover:underline break-all">shreephalhandicraft@gmail.com</a></p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-900 text-sm">
                    <strong>Important:</strong> By placing an order with Shreephal Handicrafts, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions, including our 24-hour cancellation policy and no-return policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;
