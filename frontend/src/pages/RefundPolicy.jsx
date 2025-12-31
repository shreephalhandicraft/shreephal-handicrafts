import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RotateCcw } from "lucide-react";

export default function RefundPolicy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <RotateCcw className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">
                Refund & Cancellation Policy
              </h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: January 1, 2024
            </p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  1. Cancellation Window
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We begin preparing your order after 24 hours of successful
                  placement. You may cancel your order within the first{" "}
                  <strong>24 hours</strong> and receive a
                  <strong> full refund with no deduction.</strong> Requests
                  after 24 hours may incur charges or may not be refundable
                  depending on progress.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  2. Refund Eligibility
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Refund is applicable only under the following conditions:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>
                    Full refund available if cancelled within 24 hours of order
                    placement
                  </li>
                  <li>
                    If designing is completed but printing has not begun —
                    minimum ₹500 will be deducted
                  </li>
                  <li>
                    No refund will be possible once
                    printing/customization/production has started
                  </li>
                  <li>
                    Custom-made items cannot be cancelled after customization
                    begins
                  </li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  3. Refund Processing Time
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Once approved, refunds will be processed within
                  <strong> 15 business working days</strong> and will be
                  credited to the original mode of payment used during purchase.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Refund Policy or initiate
                  a refund, please contact us:
                </p>
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
