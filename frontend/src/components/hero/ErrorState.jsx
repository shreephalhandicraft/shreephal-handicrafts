export const ErrorState = ({ error }) => {
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-br from-red-50 to-red-100">
      <div className="container mx-auto px-4 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md mx-auto">
          <p className="text-red-600 font-semibold mb-6 text-sm sm:text-base">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    </section>
  );
};
