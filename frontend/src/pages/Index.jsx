import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { FeaturedCategories } from "@/components/FeaturedCategories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { HowItWorks } from "@/components/HowItWorks";
import { HappyCustomers } from "@/components/HappyCustomers";
import { WhyChooseUs } from "@/components/WhyChooseUs";

const Index = () => {
  return (
    <Layout>
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
