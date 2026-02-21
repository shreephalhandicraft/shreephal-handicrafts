import { Layout } from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { PAGE_SEO } from "@/config/seoConfig";
import { Phone, AlertCircle, Clock, XCircle } from "lucide-react";

const RefundPolicy = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Refund Policy", url: "/refund-policy" },
  ];

  return (
    <Layout>
      <SEOHead {...PAGE_SEO.refundPolicy} />
      <OpenGraphTags {...PAGE_SEO.refundPolicy} type="website" />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Cancellation & Refund Policy</h1>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">Last updated: February 2026</p>

              {/* Important Notice */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-orange-900 mb-2">Important Notice</h3>
                    <p className="text-orange-800 text-base leading-relaxed">
                      All sales are final. We do not offer returns or exchanges. However, you may cancel your order within 24 hours of placing it.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                1. Order Cancellation - 24 Hour Window
              </h2>
              <p className="mb-4">
                You may cancel your order <strong>within 24 hours of placing it</strong> by contacting us directly. After the 24-hour window has passed, orders cannot be cancelled as production may have already begun.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                <p className="text-blue-900 font-semibold mb-2">To cancel your order:</p>
                <a
                  href="tel:+919424626008"
                  className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium"
                >
                  <Phone className="h-4 w-4" />
                  Call us at +91 9424626008
                </a>
                <p className="text-sm text-blue-700 mt-2">
                  Please have your order number ready when you call.
                </p>
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                2. No Returns or Exchanges
              </h2>
              <p className="mb-4">
                We do not accept returns or exchanges on any products, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Standard products</li>
                <li>Customized products (trophies, mementos, gifts)</li>
                <li>Products with personalized text, images, or specifications</li>
                <li>Photo frames, key holders, calendars, and other items</li>
              </ul>
              <p>
                Due to the personalized and handcrafted nature of our products, all sales are considered final once the order is confirmed and the 24-hour cancellation period has expired.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">3. Refund Process</h2>
              <p className="mb-4">
                If you successfully cancel your order within the 24-hour window:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Full refund will be initiated within 7-10 business days</li>
                <li>Refund will be processed to the original payment method</li>
                <li>You will receive a confirmation email once the refund is processed</li>
                <li>Bank processing times may vary (typically 5-7 business days)</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4">4. Damaged or Defective Products</h2>
              <p className="mb-4">
                In the rare case that you receive a damaged or defective product:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Contact us immediately upon receiving the product</li>
                <li>Provide clear photos of the damage or defect</li>
                <li>We will assess the issue and provide a replacement or refund at our discretion</li>
                <li>This must be reported within 48 hours of delivery</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4">5. Custom and Personalized Orders</h2>
              <p className="mb-4">
                Please note that customized products:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Are made to your exact specifications</li>
                <li>Cannot be resold or repurposed</li>
                <li>Are not eligible for return or exchange under any circumstances</li>
                <li>Must be cancelled within 24 hours if you change your mind</li>
              </ul>
              <p>
                Please review your customization details carefully before placing your order, as we cannot accept cancellations after the 24-hour period or offer refunds for products made according to your specifications.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">6. Order Confirmation</h2>
              <p className="mb-4">
                By placing an order, you acknowledge and agree to this cancellation and refund policy. We recommend:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Reviewing all product details, sizes, and customizations carefully</li>
                <li>Double-checking shipping addresses and contact information</li>
                <li>Ensuring you're satisfied with your selections before confirming</li>
                <li>Saving your order confirmation for reference</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8 mb-4">7. Contact Information</h2>
              <p className="mb-4">
                For any questions or concerns regarding cancellations or refunds:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href="tel:+919424626008" className="text-lg font-semibold text-primary hover:underline">
                      +91 9424626008
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href="mailto:shreephalhandicraft@gmail.com" className="text-lg font-semibold text-primary hover:underline break-all">
                      shreephalhandicraft@gmail.com
                    </a>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Business Hours: Monday - Saturday, 10:00 AM - 7:00 PM IST
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8">
                <p className="text-amber-900 font-semibold mb-2">⚠️ Please Remember:</p>
                <p className="text-amber-800">
                  You have only <strong>24 hours from the time of order placement</strong> to cancel your order. After this period, your order will be processed for production and cannot be cancelled or returned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;
