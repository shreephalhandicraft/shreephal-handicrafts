import { Layout } from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { PAGE_SEO } from "@/config/seoConfig";

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
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Refund & Return Policy</h1>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">Last updated: January 2026</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Return Window</h2>
              <p>You may return items within 7 days of delivery for a refund or exchange.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Return Conditions</h2>
              <p>Items must be unused, in original packaging, and with all tags attached.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">3. Custom Products</h2>
              <p>Customized products cannot be returned unless defective.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Refund Process</h2>
              <p>Refunds will be processed within 7-10 business days after receiving the returned item.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;
