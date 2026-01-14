import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { FeaturedCategories } from "@/components/FeaturedCategories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { HowItWorks } from "@/components/HowItWorks";
import { HappyCustomers } from "@/components/HappyCustomers";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { SEOHead } from "@/components/SEO/SEOHead";
import { StructuredData } from "@/components/SEO/StructuredData";
import { PAGE_SEO, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from "@/config/seoConfig";

const Index = () => {
  return (
    <Layout>
      {/* SEO Metadata */}
      <SEOHead
        title={PAGE_SEO.home.title}
        description={PAGE_SEO.home.description}
        keywords={PAGE_SEO.home.keywords}
        path={PAGE_SEO.home.path}
        type="website"
      />

      {/* Structured Data */}
      <StructuredData data={[ORGANIZATION_SCHEMA, WEBSITE_SCHEMA]} />

      {/* Page Content */}
      <Hero />
      {/* <FeaturedCategories /> */}
      <FeaturedProducts />
      <HowItWorks />
      <HappyCustomers />
      <WhyChooseUs />
    </Layout>
  );
};

export default Index;
