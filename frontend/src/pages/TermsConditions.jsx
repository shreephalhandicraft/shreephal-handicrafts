import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

export default function TermsConditions() {
  return (
    <Layout data-testid="layout">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText
                className="h-8 w-8 text-primary"
                data-testid="file-text-icon"
              />
              <h1 className="text-3xl font-bold">Terms & Conditions</h1>
            </div>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>

          <Card data-testid="card">
            <CardContent data-testid="card-content" className="p-8 space-y-10">
              {/* 1. Overview */}
              <section>
                <h2 className="text-2xl font-semibold mb-3">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This website is operated by{" "}
                  <strong>Shreephal Handicrafts</strong>. Throughout the site,
                  “we”, “us” and “our” refer to the company. By accessing or
                  purchasing through our platform, you engage in our service and
                  agree to follow all terms, conditions and policies mentioned
                  here. If you do not agree with these terms, please discontinue
                  the use of the website. Any updates or changes to these terms
                  may occur at any time, and continued use of the website will
                  imply acceptance.
                </p>
              </section>

              <Separator />

              {/* 2. Online Store Terms */}
              <section>
                <h2 className="text-2xl font-semibold mb-3">
                  Online Store Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By using our website, you confirm that you are of legal age or
                  have parental consent. You agree not to misuse the website,
                  conduct unlawful activities, or transmit harmful software,
                  viruses, or code. Any unethical or unauthorized use may result
                  in access termination. The purchase of our handmade trophies
                  or products implies acceptance of our store policies, product
                  quality expectations, pricing, and service terms.
                </p>
              </section>

              <Separator />

              {/* 3. Product & Pricing */}
              <section>
                <h2 className="text-2xl font-semibold mb-3">
                  Products & Pricing
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to display our products, materials, textures and
                  colors accurately, but slight variations may occur due to
                  screen differences. Prices are subject to change without
                  notice and availability may vary depending on stock. Handmade
                  items may have minor natural variations which add uniqueness
                  to each piece. We reserve the right to modify or discontinue
                  products or services at any time.
                </p>
              </section>

              <Separator />

              {/* 4. Billing & Account */}
              <section>
                <h2 className="text-2xl font-semibold mb-3">
                  Billing & Account Information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to provide correct and updated information for
                  purchases, including details such as name, address, phone
                  number and payment details. Orders may be cancelled or limited
                  if suspected to be fraudulent or bulk reseller orders. For
                  refunds and replacements, refer to our Refund Policy page.
                </p>
              </section>

              <Separator />

              {/* 5. Liability & Warranty */}
              <section>
                <h2 className="text-2xl font-semibold mb-3">
                  Liability & Warranty
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our service is provided as available. We do not guarantee
                  uninterrupted operation or that every product will meet
                  individual expectations, though we ensure handcrafted quality
                  work. We are not liable for damages due to misuse, shipping
                  delays, third-party errors or technical issues. Your decision
                  to purchase and use the product is at your own responsibility.
                </p>
              </section>

              <Separator />

              {/* 6. Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold mb-3">Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms & Conditions are governed under the laws of India.
                  Any disputes shall be resolved under Indian jurisdiction.
                </p>
              </section>

              <Separator />

              {/* 7. Contact */}
              <section>
                {" "}
                <h2 className="text-2xl font-semibold mb-4">
                  {" "}
                  Contact Information{" "}
                </h2>{" "}
                <p className="text-muted-foreground leading-relaxed">
                  {" "}
                  For queries related to Terms & Conditions, contact us at:{" "}
                </p>{" "}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  {" "}
                  <p className="font-medium">
                    Shreephal Handicrafts Support
                  </p>{" "}
                  <p className="text-muted-foreground">
                    {" "}
                    Email:{" "}
                    <a href="mailto:support@shreephal-handicrafts.com">
                      {" "}
                      shreephalhandicraft@gmail.com{" "}
                    </a>{" "}
                  </p>{" "}
                  <p className="text-muted-foreground">
                    Phone: +91-9424626008
                  </p>{" "}
                  <p className="text-muted-foreground">
                    {" "}
                    Address: Main Road, Kachiyana, Lordganj , Jabalpur , Madhya
                    Pradesh{" "}
                  </p>{" "}
                </div>{" "}
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
