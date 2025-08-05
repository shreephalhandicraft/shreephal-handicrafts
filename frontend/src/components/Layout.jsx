import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Layout = ({ children, ...props }) => {
  return (
    <div {...props} className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
