import { Upload, Palette, Truck, CheckCircle } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: Upload,
    title: "Choose & Upload",
    description:
      "Browse our products and upload your photos or design ideas. Tell us what you want!",
  },
  {
    id: 2,
    icon: Palette,
    title: "Customize",
    description:
      "Add text, choose colors, and personalize every detail to make it uniquely yours.",
  },
  {
    id: 3,
    icon: CheckCircle,
    title: "We Create",
    description:
      "Our skilled craftsmen bring your vision to life with premium materials and attention to detail.",
  },
  {
    id: 4,
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Your custom creation is carefully packaged and delivered right to your doorstep.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Creating your perfect custom item is simple! Follow these easy steps
            and we'll take care of the rest.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="text-center group relative">
                  {/* Step Number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                    {step.id}
                  </div>

                  {/* Icon Container */}
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                    <IconComponent className="h-10 w-10 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary/10 to-yellow-100 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Join hundreds of satisfied customers who've created their perfect
              custom items with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/shop"
                className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Start Creating
              </a>
              <a
                href="/contact"
                className="border border-primary text-primary px-8 py-3 rounded-lg font-medium hover:bg-primary/5 transition-colors"
              >
                Ask Questions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
