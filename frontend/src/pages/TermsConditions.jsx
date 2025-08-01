import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

export default function TermsConditions() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Terms and Conditions</h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: January 1, 2024
            </p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using Trophy Tale's website and services, you
                  accept and agree to be bound by the terms and provision of
                  this agreement. If you do not agree to abide by the above,
                  please do not use this service.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Permission is granted to temporarily download one copy of the
                  materials on Trophy Tale's website for personal,
                  non-commercial transitory viewing only. This is the grant of a
                  license, not a transfer of title, and under this license you
                  may not:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>modify or copy the materials</li>
                  <li>
                    use the materials for any commercial purpose or for any
                    public display
                  </li>
                  <li>
                    attempt to reverse engineer any software contained on the
                    website
                  </li>
                  <li>
                    remove any copyright or other proprietary notations from the
                    materials
                  </li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  3. Product Information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Trophy Tale strives to provide accurate product descriptions
                  and images. However, we do not warrant that product
                  descriptions or other content is accurate, complete, reliable,
                  current, or error-free. Colors and details may vary from those
                  shown due to monitor settings and manufacturing variations.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  4. Orders and Payment
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  All orders are subject to acceptance and availability. We
                  reserve the right to refuse any order for any reason. Payment
                  must be received in full before order processing begins.
                  Accepted payment methods include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>
                    Major credit cards (Visa, MasterCard, American Express)
                  </li>
                  <li>PayPal</li>
                  <li>Bank transfers for bulk orders</li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  5. Shipping and Delivery
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Shipping costs and delivery times vary based on location and
                  product type. Custom engraved items may require additional
                  processing time. Trophy Tale is not responsible for delays
                  caused by customs, weather, or carrier issues beyond our
                  control.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  6. Returns and Refunds
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Items may be returned within 30 days of delivery in original
                  condition. Custom engraved or personalized items are not
                  eligible for return unless defective. Refunds will be
                  processed within 5-10 business days of receiving returned
                  items.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your privacy is important to us. Please review our Privacy
                  Policy, which also governs your use of the website, to
                  understand our practices regarding the collection and use of
                  your personal information.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The materials on Trophy Tale's website are provided on an 'as
                  is' basis. Trophy Tale makes no warranties, expressed or
                  implied, and hereby disclaims and negates all other warranties
                  including without limitation, implied warranties or conditions
                  of merchantability, fitness for a particular purpose, or
                  non-infringement of intellectual property or other violation
                  of rights.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Limitations</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In no event shall Trophy Tale or its suppliers be liable for
                  any damages (including, without limitation, damages for loss
                  of data or profit, or due to business interruption) arising
                  out of the use or inability to use the materials on Trophy
                  Tale's website, even if Trophy Tale or its authorized
                  representative has been notified orally or in writing of the
                  possibility of such damage.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  10. Contact Information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms and Conditions,
                  please contact us at:
                </p>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">Trophy Tale Customer Service</p>
                  <p className="text-muted-foreground">
                    Email: legal@trophytale.com
                  </p>
                  <p className="text-muted-foreground">Phone: 1-800-TROPHY-1</p>
                  <p className="text-muted-foreground">
                    Address: 123 Trophy Lane, Achievement City, AC 12345
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
