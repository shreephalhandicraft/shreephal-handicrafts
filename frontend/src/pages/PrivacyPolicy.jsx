import { Layout } from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { PAGE_SEO } from "@/config/seoConfig";

const PrivacyPolicy = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Privacy Policy", url: "/privacy-policy" },
  ];

  return (
    <Layout>
      <SEOHead {...PAGE_SEO.privacyPolicy} />
      <OpenGraphTags {...PAGE_SEO.privacyPolicy} type="website" />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Privacy Policy</h1>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">Last updated: January 2026</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly, including name, email, phone, and shipping address.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
              <p>We use your information to process orders, communicate with you, and improve our services.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Security</h2>
              <p>We implement security measures to protect your personal information.</p>
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal data.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
