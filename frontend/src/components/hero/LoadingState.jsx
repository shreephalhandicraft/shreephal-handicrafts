export const LoadingState = () => {
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 text-center">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-2/3 mx-auto"></div>
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-1/2 mx-auto"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl h-96 animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
