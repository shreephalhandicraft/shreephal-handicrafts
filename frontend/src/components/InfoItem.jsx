export function InfoItem({ icon: Icon, label, value, multiline = false }) {
  return (
    <div
      className={`flex ${
        multiline ? "" : "items-center"
      } gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg`}
    >
      <Icon
        className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-600 ${
          multiline ? "mt-1" : ""
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-600">{label}</p>
        <p
          className={`font-medium text-sm sm:text-base ${
            multiline ? "leading-relaxed" : "truncate"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
