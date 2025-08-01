import { Shield, Truck, Palette, Users } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Quality Guarantee",
    description:
      "We stand behind every product with our quality guarantee and hassle-free returns.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description:
      "Quick turnaround times with tracking provided for all orders.",
  },
  {
    icon: Palette,
    title: "Full Customization",
    description:
      "Upload your images, add text, choose colors - make it uniquely yours.",
  },
  {
    icon: Users,
    title: "Expert Support",
    description:
      "Our friendly team is here to help with design ideas and order questions.",
  },
];

export const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Trophy Tale?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're passionate about creating meaningful, personalized items that
            celebrate your achievements and memories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
