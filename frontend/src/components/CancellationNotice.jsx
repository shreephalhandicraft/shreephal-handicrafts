// frontend/src/components/CancellationNotice.jsx
import { AlertCircle, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * CancellationNotice Component
 * Displays the 24-hour cancellation policy notice to users
 * 
 * @param {Object} props
 * @param {string} props.variant - Alert variant (default, destructive, etc.)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showIcon - Whether to show the phone icon (default: true)
 */
export const CancellationNotice = ({ 
  variant = "default", 
  className = "",
  showIcon = true 
}) => {
  const phoneNumber = "+91 98765 43210"; // Update with your actual phone number

  return (
    <Alert 
      variant={variant} 
      className={`border-orange-200 bg-orange-50 ${className}`}
    >
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800 font-medium">
        <div className="flex items-start gap-2">
          {showIcon && <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <span>
            To cancel your order, call us within 24 hours of placing your order at{" "}
            <a 
              href={`tel:${phoneNumber}`} 
              className="font-bold underline hover:text-orange-900 transition-colors"
            >
              {phoneNumber}
            </a>
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default CancellationNotice;
