import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * 
 * Automatically scrolls to the top of the page when the route changes.
 * This fixes the issue where users land at the footer or middle of pages
 * when navigating between different routes.
 * 
 * Usage: Place once in App.jsx or main routing component
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top whenever the pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use "instant" for immediate scroll, "smooth" for animated
    });
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

export default ScrollToTop;
