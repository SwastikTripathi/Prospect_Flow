
'use client';

import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function RefundPolicyPage() {
  const staticDate = "June 12, 2025";
  const placeholderGrievanceName = "[Full Name]";
  const placeholderGrievancePhone = "[Phone: Optional]";


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-[5vw] md:px-[10vw]">
          <header className="mb-12 text-center">
            <RefreshCcw className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter font-headline text-foreground">
              Refund & Cancellation Policy
            </h1>
            {/* Effective and Last Updated dates are now part of the main content as per user's HTML */}
          </header>

          <Card className="shadow-lg">
            <CardContent className="prose prose-sm dark:prose-invert max-w-none py-8 px-6 md:px-8 space-y-6">
              <p><strong>Effective Date:</strong> {staticDate}<br />
              <strong>Last Updated:</strong> {staticDate}</p>

              <h2>1. Introduction</h2>
              <p>Hey there! Welcome to ProspectFlow’s Refund & Cancellation Policy. We know fine print isn’t your favorite reading material, so we’ve made this as clear and concise as possible (while still keeping our lawyers happy 😄).</p>
              <p>This policy outlines how we handle subscription payments, cancellations, and refund requests. It applies to all services offered by ProspectFlow, operated by <strong>ProspectFlow Inc.</strong>, through our website and app.</p>
              <p>By purchasing a subscription or using our services, you agree to the terms below. This policy is part of our broader legal agreement, including our <Link href="/terms-and-conditions">Terms & Conditions</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</p>

              <h2>2. Free Tier Access</h2>
              <ul>
                <li><strong>Always Free. Forever.</strong> You can use our Free Tier at no cost and without entering payment information.</li>
                <li><strong>No Strings Attached.</strong> No refund is necessary because you never paid. Enjoy exploring!</li>
              </ul>

              <h2>3. Paid Plans & Subscription Model</h2>
              <ul>
                <li><strong>Fixed-Term Only:</strong> We offer one-time, pre-paid subscription plans (e.g., 1 month, 6 months, 12 months).</li>
                <li><strong>No Auto-Renewal:</strong> You pay once, use it, and decide whether to renew. No surprise charges here.</li>
                <li><strong>Access Duration:</strong> Your premium features remain active for the full duration you paid for—even if you cancel early.</li>
                <li><strong>Downgrade to Free Tier:</strong> After expiry, you’ll revert to our Free Tier with limited access.</li>
              </ul>

              <h2>4. Refund Policy Overview</h2>
              <p>We aim to be fair, but also transparent. Our <strong>default stance is no refunds</strong>, with some exceptions.</p>
              <h3>✅ Refunds Will Not Be Issued for:</h3>
              <ul>
                <li>Changing your mind after purchase.</li>
                <li>Dissatisfaction with features (try the Free Tier first!).</li>
                <li>Forgetting to cancel or assuming auto-renewal.</li>
                <li>Inactivity during the subscription.</li>
                <li>Suspensions due to Terms of Use violations.</li>
                <li>Choosing the wrong plan or duration (unless it’s our billing error).</li>
              </ul>

              <h2>5. Exceptional Refunds (Case-by-Case)</h2>
              <p>We <em>may</em> consider refunds under these rare circumstances:</p>
              <h3>🔄 Billing Errors:</h3>
              <p>If you were overcharged or double-charged due to a mistake on our side, we’ll fix it and issue a refund promptly.</p>
              <h3>🛠️ Service Outage:</h3>
              <p>If our paid features were <strong>completely down</strong> for <strong>3+ consecutive days</strong>, and it was <strong>our fault</strong> (not due to maintenance or external issues), we’ll consider a pro-rated refund.</p>
              <h3>⚖️ Legal Requirements:</h3>
              <p>If laws in your country give you additional refund rights (like the <strong>14-day cooling-off period in the EU</strong>), we’ll honor them. If you <strong>begin using</strong> the service during that window, your refund rights may be waived under applicable law.</p>

              <h2>6. How to Request a Refund</h2>
              <p>Think you&apos;re eligible for a refund? Here&apos;s how to ask:</p>
              <p><strong>📩 Email us at:</strong> <a href="mailto:support@prospectflow.com">support@prospectflow.com</a></p>
              <p><strong>Include:</strong></p>
              <ul>
                <li>Your full name and account email.</li>
                <li>Date of purchase and plan type.</li>
                <li>The reason for the refund (with any evidence—e.g., screenshots or transaction ID).</li>
              </ul>
              <p><strong>⏳ Time limit:</strong> Send your request within <strong>14 days</strong> of the issue or transaction (unless your jurisdiction allows more time).</p>
              <p><strong>🧾 Response Time:</strong> We’ll reply within <strong>7–10 business days</strong>.</p>
              <p><strong>💳 Refunds (if approved):</strong> Processed via <strong>Razorpay</strong> within <strong>5–10 business days</strong> back to your original payment method.</p>

              <h2>7. Handling Cancellations</h2>
              <ul>
                <li><strong>Cancel Anytime:</strong> Since there’s no auto-renewal, you don’t need to cancel. Just let the term expire.</li>
                <li><strong>Account Deletion:</strong> Want to wipe your account? You can delete it permanently via your Settings page.</li>
                <li><strong>Post-Cancellation Data Access:</strong> After cancellation or expiry:
                  <ul>
                    <li>Your data remains accessible for <strong>30 days</strong>.</li>
                    <li>After that, we may archive or delete it in accordance with our <Link href="/privacy-policy">Privacy Policy</Link> and data retention obligations.</li>
                  </ul>
                </li>
              </ul>

              <h2>8. Chargebacks & Disputes</h2>
              <p>We get it—things happen. But please talk to us before initiating a chargeback.</p>
              <ul>
                <li><strong>Unfair Chargebacks:</strong> If you issue a chargeback without contacting us first, we may suspend or terminate your account.</li>
                <li><strong>Fraud Prevention:</strong> We reserve the right to reject refund requests suspected of abuse (e.g., using most of the service and then demanding a full refund).</li>
                <li><strong>Dispute Resolution:</strong> If you&apos;re unhappy with how your refund was handled:
                  <ul>
                    <li><strong>India:</strong> Contact our Grievance Officer (below).</li>
                    <li><strong>EU/UK:</strong> You may use local alternative dispute resolution bodies.</li>
                    <li><strong>Other countries:</strong> Please reach out and we’ll aim to resolve things informally and fairly.</li>
                  </ul>
                </li>
              </ul>

              <h2>9. Compliance With Global Laws</h2>
              <p>We respect your rights—wherever you are. Here’s how we comply:</p>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border text-left">Jurisdiction</th>
                      <th className="px-4 py-2 border text-left">Key Consumer Rights</th>
                      <th className="px-4 py-2 border text-left">Our Policy Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="px-4 py-2 border"><strong>EU/UK</strong></td><td className="px-4 py-2 border">14-day refund window for digital services</td><td className="px-4 py-2 border">Honored (waived if service is accessed)</td></tr>
                    <tr><td className="px-4 py-2 border"><strong>US (California)</strong></td><td className="px-4 py-2 border">Clear cancellation & refund terms (AB 390, CCPA)</td><td className="px-4 py-2 border">No auto-renewal; refund terms stated clearly</td></tr>
                    <tr><td className="px-4 py-2 border"><strong>India (CPA 2019, DPDPA)</strong></td><td className="px-4 py-2 border">Transparency + grievance officer</td><td className="px-4 py-2 border">Compliant (see contact below)</td></tr>
                    <tr><td className="px-4 py-2 border"><strong>Canada (PIPEDA)</strong></td><td className="px-4 py-2 border">Data transparency + fairness</td><td className="px-4 py-2 border">Addressed in Privacy & Refund policies</td></tr>
                    <tr><td className="px-4 py-2 border"><strong>Brazil (LGPD)</strong></td><td className="px-4 py-2 border">Consumer protection + right to information</td><td className="px-4 py-2 border">Refunds assessed fairly; rights respected</td></tr>
                  </tbody>
                </table>
              </div>

              <h2>10. Accessibility & Inclusion</h2>
              <p>Everyone deserves clear access to help.</p>
              <ul>
                <li>Refund instructions are screen-reader friendly.</li>
                <li>We aim to ensure forms and content meet WCAG 2.1 accessibility standards.</li>
                <li>Need help in a different format? Email us and we’ll accommodate you.</li>
              </ul>

              <h2>11. Contact Us</h2>
              <p><strong>Support Team:</strong> <a href="mailto:support@prospectflow.com">support@prospectflow.com</a></p>
              <p><strong>Grievance Officer (India):</strong><br />
              {placeholderGrievanceName}<br />
              Email: <a href="mailto:grievance@prospectflow.com">grievance@prospectflow.com</a><br />
              {placeholderGrievancePhone}<br />
              Address: ProspectFlow Inc.<br />
              123 Prospect Lane<br />
              San Francisco, CA 94105<br />
              United States</p>
              <p><strong>Business Address (for regulatory compliance):</strong><br />
              ProspectFlow Inc.<br />
              123 Prospect Lane<br />
              San Francisco, CA 94105<br />
              United States</p>

              <h2>12. Updates to This Policy</h2>
              <p>We may update this policy from time to time. If we make <strong>material changes</strong>, we’ll:</p>
              <ul>
                <li>Post the update on our website and app.</li>
                <li>Email you or show an in-app notification (if you&apos;re a subscriber).</li>
              </ul>
              <p><strong>Continued use</strong> of our service means you accept the changes.</p>

              <h2>TL;DR Recap (because we’re nice like that):</h2>
              <ul>
                <li>🆓 Free Tier is forever free.</li>
                <li>💳 Paid plans don’t auto-renew.</li>
                <li>🙅 No refunds for changing your mind or inactivity.</li>
                <li>🧾 Refunds possible for billing errors, outages, or legal reasons.</li>
                <li>🗓️ Request refunds within 14 days.</li>
                <li>🧑‍⚖️ We follow local laws. You&apos;re protected.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
