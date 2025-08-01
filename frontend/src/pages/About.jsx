import { Layout } from "@/components/Layout";
import { Award, Users, Clock, Heart } from "lucide-react";

const About = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Trophy Tale
            </h1>
            <p className="text-xl text-gray-600">
              We're passionate about creating beautiful, personalized items that
              celebrate life's special moments and achievements. Every piece we
              craft tells a unique story.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-gray-600 mb-4">
                Founded in 2020, Trophy Tale began as a small family business
                with a simple mission: to help people celebrate their
                achievements and preserve precious memories through beautiful,
                custom-made items.
              </p>
              <p className="text-gray-600 mb-4">
                What started as a local shop has grown into a trusted online
                destination for personalized trophies, photo frames, key
                holders, and calendars. We've had the privilege of being part of
                countless celebrations, from sports victories to academic
                achievements, from family milestones to corporate recognitions.
              </p>
              <p className="text-gray-600">
                Today, we continue to uphold our commitment to quality
                craftsmanship, exceptional customer service, and making every
                product as unique as the story it represents.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-yellow-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">5000+</div>
                  <div className="text-sm text-gray-600">Products Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">4.8★</div>
                  <div className="text-sm text-gray-600">Customer Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">24h</div>
                  <div className="text-sm text-gray-600">Fast Turnaround</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do, from product design to
              customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Quality First
              </h3>
              <p className="text-gray-600">
                We use only the finest materials and craftsmanship to ensure
                every product meets our high standards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Customer Focus
              </h3>
              <p className="text-gray-600">
                Your satisfaction is our priority. We're here to help make your
                vision come to life.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Reliability
              </h3>
              <p className="text-gray-600">
                Count on us for timely delivery and consistent quality, order
                after order.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Passion
              </h3>
              <p className="text-gray-600">
                We love what we do, and it shows in every carefully crafted
                piece we create.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind Trophy Tale, dedicated to
              bringing your ideas to life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-yellow-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sarah Johnson
              </h3>
              <p className="text-primary font-medium mb-2">Founder & CEO</p>
              <p className="text-gray-600 text-sm">
                Creative visionary with 15 years of experience in custom design
                and manufacturing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-yellow-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Award className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mike Chen
              </h3>
              <p className="text-primary font-medium mb-2">
                Head of Production
              </p>
              <p className="text-gray-600 text-sm">
                Master craftsman ensuring every product meets our quality
                standards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-yellow-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Emma Davis
              </h3>
              <p className="text-primary font-medium mb-2">Customer Success</p>
              <p className="text-gray-600 text-sm">
                Dedicated to making every customer experience exceptional and
                memorable.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
