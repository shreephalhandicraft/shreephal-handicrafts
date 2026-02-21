import { AlertCircle, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * CancellationNotice Component
 * Displays the 24-hour cancellation policy message
 * 
 * @param {string} variant - Alert variant (default, destructive, etc.)
 * @param {string} className - Additional CSS classes
 * @param {boolean} showIcon - Whether to show the alert icon (default: true)
 */
export const CancellationNotice = ({ 
  variant = "default", 
  className = "",
  showIcon = true 
}) => {
  return (
    <Alert 
      variant={variant} 
      className={`border-orange-200 bg-orange-50 ${className}`}
    >
      {showIcon && <AlertCircle className="h-4 w-4 text-orange-600" />}
      <AlertDescription className="text-orange-800 font-medium flex items-center gap-2">
        <Phone className="h-4 w-4 flex-shrink-0" />
        <span>
          To cancel your order, call us within 24 hours of placing your order at{" "}
          <a 
            href="tel:+919755552244" 
            className="font-bold underline hover:text-orange-900 transition-colors"
          >
            +91 97555 52244
          </a>
        </span>
      </AlertDescription>
    </Alert>
  );
};

export default CancellationNotice;