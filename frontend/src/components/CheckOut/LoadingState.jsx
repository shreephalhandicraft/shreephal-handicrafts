import React from "react";
import { Layout } from "@/components/Layout";

const LoadingState = ({ type = "loading" }) => {
  const content = {
    loading: {
      title: "Loading checkout...",
      description: "",
    },
    processing: {
      title: "Processing Payment...",
      description: "Please wait while we confirm your payment.",
    },
    failed: {
      title: "Payment Failed",
      description: "Your payment could not be processed.",
    },
  };

  return (
    <Layout>
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">
              {content[type].title}
            </h1>
            {content[type].description && (
              <p className="text-gray-600">{content[type].description}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoadingState;
