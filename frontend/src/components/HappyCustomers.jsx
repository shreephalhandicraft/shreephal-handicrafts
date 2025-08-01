import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Soccer Mom",
    image: "/placeholder.svg",
    rating: 5,
    text: "The custom trophy for my daughter's team was absolutely perfect! The quality exceeded my expectations and the kids were thrilled. Will definitely order again!",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Office Manager",
    image: "/placeholder.svg",
    rating: 5,
    text: "We ordered personalized key holders for our office team. The craftsmanship is excellent and the delivery was super fast. Highly recommend Trophy Tale!",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Wedding Planner",
    image: "/placeholder.svg",
    rating: 5,
    text: "The custom photo frames for our wedding favors were stunning! Every guest loved them. The attention to detail and customer service was outstanding.",
  },
  {
    id: 4,
    name: "David Thompson",
    role: "Sports Coach",
    image: "/placeholder.svg",
    rating: 5,
    text: "Trophy Tale has been our go-to for all team awards. Consistent quality, fair prices, and they always deliver on time. The kids love their personalized trophies!",
  },
];

export const HappyCustomers = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-yellow-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Happy Customers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear what our satisfied customers
            have to say about their Trophy Tale experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover-scale"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="h-8 w-8 text-primary/30" />
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Customer Info */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-500 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
              500+
            </div>
            <p className="text-gray-600">Happy Customers</p>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
              1000+
            </div>
            <p className="text-gray-600">Custom Items Created</p>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
              4.9★
            </div>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
};
