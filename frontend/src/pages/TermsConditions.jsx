import { Layout } from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { PAGE_SEO } from "@/config/seoConfig";

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
              <p className="text-gray-600 mb-6">Last updated: January 2026</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using Shreephal Handicrafts website, you accept and agree to be bound by these terms and conditions.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Products and Services</h2>
              <p>All products are subject to availability. We reserve the right to discontinue any product at any time.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">3. Pricing</h2>
              <p>Prices are subject to change without notice. We strive to ensure accuracy but errors may occur.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Orders</h2>
              <p>We reserve the right to refuse or cancel any order for any reason.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;
