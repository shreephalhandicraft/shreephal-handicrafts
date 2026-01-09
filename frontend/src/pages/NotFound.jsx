import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  return (
    <Layout>
      {/* SEO - Prevent 404 pages from being indexed */}
      <Helmet>
        <title>404 - Page Not Found | Shreephal Handicrafts</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="The page you're looking for doesn't exist. Return to Shreephal Handicrafts homepage."
        />
      </Helmet>

      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
              <div className="h-2 w-32 bg-primary/20 rounded-full mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Oops! Page Not Found
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                The page you're looking for seems to have wandered off. Don't worry,
                our beautiful handicrafts are still waiting for you!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/">
                <Button size="lg" className="w-full sm:w-auto">
                  <Home className="h-5 w-5 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/shop">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Search className="h-5 w-5 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Popular Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  to="/category/trophies/products"
                  className="text-primary hover:underline"
                >
                  Trophies
                </Link>
                <Link
                  to="/category/awards/products"
                  className="text-primary hover:underline"
                >
                  Awards
                </Link>
                <Link
                  to="/category/medals/products"
                  className="text-primary hover:underline"
                >
                  Medals
                </Link>
                <Link
                  to="/category/handicrafts/products"
                  className="text-primary hover:underline"
                >
                  Handicrafts
                </Link>
              </div>
            </div>

            <button
              onClick={() => window.history.back()}
              className="mt-8 text-gray-600 hover:text-primary transition-colors inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back to previous page
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;