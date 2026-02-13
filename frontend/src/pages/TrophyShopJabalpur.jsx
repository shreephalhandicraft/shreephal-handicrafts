import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Trophy, Award, Star, MapPin, Phone, Mail, Clock, 
  CheckCircle, Users, Shield, Zap 
} from 'lucide-react';

const TrophyShopJabalpur = () => {
  const features = [
    { icon: Trophy, title: '500+ Trophy Designs', desc: 'Sports, corporate, academic awards' },
    { icon: Award, title: 'Custom Engraving', desc: 'Free text engraving on all trophies' },
    { icon: Zap, title: 'Fast Delivery', desc: 'Quick delivery in Jabalpur' },
    { icon: Shield, title: 'Quality Guaranteed', desc: '100% satisfaction or money back' }
  ];

  const trophyTypes = [
    'Sports Trophies',
    'Corporate Awards',
    'Academic Trophies',
    'Championship Cups',
    'Plaques & Shields',
    'Medals & Badges',
    'Crystal Awards',
    'Wooden Trophies'
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Sports Academy Director',
      text: 'Best trophy shop in Jabalpur! Quality trophies at affordable prices. Delivered our annual day awards on time.'
    },
    {
      name: 'Priya Sharma',
      role: 'Corporate HR Manager',
      text: 'Professional service and beautiful custom awards. Our employees loved the recognition trophies!'
    },
    {
      name: 'Dr. Amit Verma',
      role: 'School Principal',
      text: '23 years of excellence shows! Reliable, creative, and always deliver beyond expectations.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Trophy Shop in Jabalpur | Custom Trophies & Awards | Shreephal Handicrafts</title>
        <meta name="description" content="#1 Trophy Shop in Jabalpur with 23+ years experience. Custom trophies, sports awards, corporate plaques & medals. Located at Lordganj. Call +91 9424626008" />
        <meta name="keywords" content="trophy shop jabalpur, custom trophies jabalpur, awards shop jabalpur, sports trophies, corporate awards, medal shop, trophy makers near me, lordganj trophy shop" />
        <link rel="canonical" href="https://shreephalhandicrafts.com/trophy-shop-jabalpur" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Trophy Shop in Jabalpur | Shreephal Handicrafts" />
        <meta property="og:description" content="#1 Trophy Shop in Jabalpur. Custom trophies, awards & medals. 23+ years experience. Quick delivery. Call +91 9424626008" />
        <meta property="og:url" content="https://shreephalhandicrafts.com/trophy-shop-jabalpur" />
        <meta property="og:type" content="website" />
        
        {/* Local Business Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "Shreephal Handicrafts - Trophy Shop Jabalpur",
            "image": "https://shreephalhandicrafts.com/banner-hero.jpg",
            "url": "https://shreephalhandicrafts.com/trophy-shop-jabalpur",
            "telephone": "+919424626008",
            "email": "shreephalhandicraft@gmail.com",
            "priceRange": "₹₹",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Main Road, Kachiyana",
              "addressLocality": "Lordganj, Jabalpur",
              "addressRegion": "Madhya Pradesh",
              "postalCode": "482002",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 23.1815,
              "longitude": 79.9864
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              "opens": "09:00",
              "closes": "18:00"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "150"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Trophy & Awards Catalog",
              "itemListElement": [
                {
                  "@type": "OfferCatalog",
                  "name": "Sports Trophies",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Product",
                        "name": "Custom Sports Trophy",
                        "description": "Personalized sports trophies with free engraving"
                      }
                    }
                  ]
                },
                {
                  "@type": "OfferCatalog",
                  "name": "Corporate Awards",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Product",
                        "name": "Corporate Award Plaque",
                        "description": "Professional awards for employee recognition"
                      }
                    }
                  ]
                }
              ]
            }
          })}
        </script>
        
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://shreephalhandicrafts.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Trophy Shop Jabalpur",
                "item": "https://shreephalhandicrafts.com/trophy-shop-jabalpur"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="w-6 h-6" />
                <span className="text-lg font-semibold">Lordganj, Jabalpur, Madhya Pradesh</span>
              </div>
              <h1 className="text-5xl font-bold mb-6">
                #1 Trophy Shop in Jabalpur
              </h1>
              <p className="text-xl mb-8 opacity-95">
                Custom Trophies, Awards & Medals | 23+ Years of Excellence | Quick Delivery
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  to="/category/trophies/products"
                  className="bg-white text-amber-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
                >
                  Browse Trophies
                </Link>
                <a 
                  href="tel:+919424626008"
                  className="bg-amber-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-amber-900 transition-all shadow-lg flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call +91 9424626008
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-amber-600 mb-2">23+</div>
                <div className="text-gray-600 dark:text-gray-400">Years Experience</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-amber-600 mb-2">500+</div>
                <div className="text-gray-600 dark:text-gray-400">Trophy Designs</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-amber-600 mb-2">5000+</div>
                <div className="text-gray-600 dark:text-gray-400">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-amber-600 mb-2">4.8★</div>
                <div className="text-gray-600 dark:text-gray-400">Customer Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
              Why Choose Shreephal Handicrafts?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                    <Icon className="w-12 h-12 text-amber-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trophy Types */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
              Trophy Categories in Jabalpur
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {trophyTypes.map((type, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-gray-600 transition-colors">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="font-medium dark:text-white">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
              What Our Jabalpur Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact/Visit Section */}
        <section className="py-16 bg-gradient-to-r from-amber-600 to-yellow-500 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-8">Visit Our Trophy Shop in Jabalpur</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <a
                  href="https://maps.google.com/?q=Main+Road+Kachiyana+Lordganj+Jabalpur+Madhya+Pradesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-sm p-6 rounded-lg hover:bg-white/20 transition-all cursor-pointer"
                >
                  <MapPin className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-sm">Main Road, Kachiyana<br />Lordganj, Jabalpur<br />Madhya Pradesh - 482002</p>
                </a>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                  <div className="space-y-4">
                    <a 
                      href="tel:+919424626008" 
                      className="block hover:bg-white/10 p-2 rounded transition-all"
                    >
                      <Phone className="w-8 h-8 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Call Us</h3>
                      <p className="text-sm font-medium">+91 9424626008</p>
                    </a>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                  <a 
                    href="mailto:shreephalhandicraft@gmail.com" 
                    className="block hover:bg-white/10 p-2 rounded transition-all"
                  >
                    <Mail className="w-8 h-8 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Email Us</h3>
                    <p className="text-sm break-all">shreephalhandicraft@gmail.com</p>
                  </a>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg max-w-md mx-auto mb-8">
                <Clock className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Business Hours</h3>
                <p className="text-sm">Monday - Saturday: 9:00 AM - 6:00 PM<br />Sunday: Closed</p>
              </div>
              <Link 
                to="/contact"
                className="inline-block bg-white text-amber-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Get Directions & Contact
              </Link>
            </div>
          </div>
        </section>

        {/* SEO Content */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-3xl font-bold mb-6 dark:text-white">Best Trophy Shop in Jabalpur - Shreephal Handicrafts</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Looking for a reliable <strong>trophy shop in Jabalpur</strong>? Shreephal Handicrafts has been the city's premier destination for custom trophies, awards, and medals for over 23 years. Located at Main Road, Kachiyana, Lordganj, we serve schools, colleges, sports clubs, corporate offices, and individuals across Jabalpur and Madhya Pradesh.
              </p>
              
              <h3 className="text-2xl font-semibold mb-4 mt-8 dark:text-white">Our Trophy Collection</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We offer an extensive range of trophies including sports trophies for cricket, football, badminton, and athletics; corporate awards for employee recognition and milestones; academic trophies for schools and colleges; and custom-designed trophies for special events. All our trophies come with free engraving services to personalize your awards.
              </p>
              
              <h3 className="text-2xl font-semibold mb-4 mt-8 dark:text-white">Contact Us Today</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Visit our showroom at Lordganj, Jabalpur or call us at <strong>+91 9424626008</strong> to discuss your trophy requirements. We also accept orders via email at <strong>shreephalhandicraft@gmail.com</strong>. Our team is ready to help you create the perfect awards for your special occasion.
              </p>
              
              <h3 className="text-2xl font-semibold mb-4 mt-8 dark:text-white">Why Jabalpur Trusts Us</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                With 23+ years of experience serving Jabalpur, we've become the go-to trophy shop for quality and reliability. Our competitive pricing, quick delivery for stock items, and commitment to customer satisfaction have earned us the trust of over 5,000 customers. Visit our showroom to see our complete collection, or call us for bulk orders and special customization requests.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TrophyShopJabalpur;