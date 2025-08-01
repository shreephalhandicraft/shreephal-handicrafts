import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Award,
  Shield,
  Truck,
  HeadphonesIcon,
} from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/20 to-transparent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-500 rounded-full blur-2xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
        {/* Top Section - Company Features */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Award className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
            <h4 className="text-xs sm:text-sm font-semibold mb-1">
              Premium Quality
            </h4>
            <p className="text-xs text-gray-400">Handcrafted Excellence</p>
          </div>

          <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
            <h4 className="text-xs sm:text-sm font-semibold mb-1">
              Fast Delivery
            </h4>
            <p className="text-xs text-gray-400">Quick & Secure</p>
          </div>

          <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
            <h4 className="text-xs sm:text-sm font-semibold mb-1">
              Secure Payment
            </h4>
            <p className="text-xs text-gray-400">100% Protected</p>
          </div>

          <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <HeadphonesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
            <h4 className="text-xs sm:text-sm font-semibold mb-1">
              24/7 Support
            </h4>
            <p className="text-xs text-gray-400">Always Here</p>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4">
                Shrifal-Handicrafts
              </h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4 sm:mb-6">
                Creating beautiful, customized trophies, mementos, and gifts
                that celebrate your special moments with premium craftsmanship.
              </p>
            </div>

            {/* Social Media */}
            <div>
              <h5 className="text-sm font-semibold mb-3 text-gray-200">
                Follow Us
              </h5>
              <div className="flex space-x-3 sm:space-x-4">
                <a
                  href="https://facebook.com/shrifalhandicrafts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 sm:p-3 rounded-full bg-white/10 hover:bg-primary/20 border border-white/20 hover:border-primary/50 transition-all duration-300"
                >
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://instagram.com/shrifalhandicrafts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 sm:p-3 rounded-full bg-white/10 hover:bg-primary/20 border border-white/20 hover:border-primary/50 transition-all duration-300"
                >
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://twitter.com/shrifalhandicrafts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 sm:p-3 rounded-full bg-white/10 hover:bg-primary/20 border border-white/20 hover:border-primary/50 transition-all duration-300"
                >
                  <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">
              Quick Links
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { to: "/", label: "Home" },
                { to: "/shop", label: "Shop" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact" },
                { to: "/cart", label: "Shopping Cart" },
                { to: "/favourites", label: "Favourites" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex items-center text-sm sm:text-base text-gray-300 hover:text-primary transition-all duration-300"
                  >
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Categories */}
          <div className="space-y-4">
            <h4 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">
              Our Products
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                {
                  to: "/category/trophies/products",
                  label: "Trophies & Awards",
                },
                {
                  to: "/category/photo-frames/products",
                  label: "Photo Frames",
                },
                { to: "/category/key-holders/products", label: "Key Holders" },
                {
                  to: "/category/calendars/products",
                  label: "Custom Calendars",
                },
             
                { to: "/shop", label: "View All Products" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex items-center text-sm sm:text-base text-gray-300 hover:text-primary transition-all duration-300"
                  >
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">
              Get In Touch
            </h4>
            <div className="space-y-4 sm:space-y-5">
              <a
                href="tel:+919424626008"
                className="group flex items-start space-x-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
              >
                <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">
                    Call Us
                  </p>
                  <p className="text-sm sm:text-base text-white font-medium">
                    (+91) 9424626008
                  </p>
                </div>
              </a>

              <a
                href="mailto:910761ranu@gmail.com"
                className="group flex items-start space-x-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
              >
                <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">
                    Email Us
                  </p>
                  <p className="text-sm sm:text-base text-white font-medium break-all">
                    910761ranu@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="https://maps.google.com/?q=Main+Road+Kachiyana+Lordganj+Jabalpur+Madhya+Pradesh"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start space-x-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
              >
                <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">
                    Visit Us
                  </p>
                  <p className="text-sm sm:text-base text-white font-medium leading-relaxed">
                    Main Road, Kachiyana, Lordganj
                    <br />
                    Jabalpur, Madhya Pradesh
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800/50 mt-12 sm:mt-16 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <p className="text-sm text-gray-400">
                &copy; 2024 Shrifal-Handicrafts. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 text-xs sm:text-sm">
                <Link
                  to="/terms-conditions"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Terms & Conditions
                </Link>
                <span className="text-gray-600">•</span>
                <Link
                  to="/privacy-policy"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-right">
              <p>Made with ❤️ for celebrating your achievements</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
