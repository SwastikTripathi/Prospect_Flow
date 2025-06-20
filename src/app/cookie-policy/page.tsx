
'use client';

import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import Link from 'next/link';

export default function CookiePolicyPage() {
  const staticDate = "June 12, 2025";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-[5vw] md:px-[10vw]">
          <header className="mb-12 text-center">
            <Cookie className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter font-headline text-foreground">
              Cookie Policy
            </h1>
            {/* Effective and Last Updated dates are now part of the main content as per user's HTML */}
          </header>

          <Card className="shadow-lg">
            <CardContent className="prose prose-sm dark:prose-invert max-w-none py-8 px-6 md:px-8 space-y-6">
              <p><strong>Effective Date:</strong> {staticDate}<br />
              <strong>Last Updated:</strong> {staticDate}</p>

              <h2>1. Introduction</h2>
              <p>Welcome to <strong>ProspectFlow</strong> ("we", "us", or "our"). This Cookie Policy explains how we use cookies and similar technologies when you visit <a href="https://prospectflow.com">https://prospectflow.com</a> or use any of our related services ("Service").</p>
              <p>This policy works alongside our <Link href="/privacy-policy">Privacy Policy</Link>, which details how we handle personal data.</p>
              <p>By using our Service, you agree to the use of essential cookies as outlined here. If we introduce non-essential cookies (e.g., analytics, advertising), we will ask for your explicit consent via a cookie banner.</p>

              <h2>2. What Are Cookies?</h2>
              <p>Cookies are small text files placed on your device when you visit a website. They allow the site to function properly, remember your preferences, and enhance your experience.</p>
              <p>We also use technologies similar to cookies, including:</p>
              <ul>
                <li><strong>localStorage</strong> – For storing preferences (e.g., theme, onboarding status)</li>
                <li><strong>SessionStorage</strong></li>
                <li><strong>Pixels and Web Beacons</strong> (not currently used but may be introduced in the future)</li>
              </ul>

              <h2>3. How We Use Cookies and Similar Technologies</h2>
              <h3>a. Strictly Necessary (Essential)</h3>
              <p>These cookies are vital for our service to function:</p>
              <ul>
                <li><strong>Authentication (Supabase)</strong> – Stores tokens to log you in and manage sessions (<code>sb-access-token</code>, <code>sb-refresh-token</code>)</li>
                <li><strong>Hosting (Firebase)</strong> – May set operational cookies for performance and security</li>
                <li><strong>Payments (Razorpay)</strong> – Uses cookies for fraud detection and transaction processing</li>
              </ul>

              <h3>b. Functionality (localStorage)</h3>
              <p>Used to improve user experience:</p>
              <ul>
                <li><code>theme</code> – stores your light/dark mode preference</li>
                <li><code>onboardingCompleted</code> – tracks tutorial completion</li>
              </ul>
              <p>These items are stored persistently in your browser and do not expire unless manually cleared.</p>

              <h3>c. Performance / Analytics</h3>
              <p>We do <strong>not currently</strong> use any analytics cookies (e.g., Google Analytics).</p>
              <p>If that changes, you will receive a cookie banner and choice to consent or decline.</p>
              <p>Supabase and Firebase <strong>may</strong> collect anonymized metadata for service reliability, in line with their policies.</p>

              <h3>d. Advertising / Targeting</h3>
              <p>We do <strong>not</strong> use any advertising or tracking cookies.</p>
              <p>If introduced in the future, we will notify users, update this policy, and request explicit consent before enabling them.</p>

              <h2>4. Cookie & Storage Types</h2>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Session Cookies</strong></td>
                      <td>Deleted when you close your browser. Used for login sessions.</td>
                    </tr>
                    <tr>
                      <td><strong>Persistent Cookies/Storage</strong></td>
                      <td>Remain on your device until you delete them. Used for preferences, etc.</td>
                    </tr>
                    <tr>
                      <td><strong>First-Party Cookies</strong></td>
                      <td>Set by <code>prospectflow.com</code> (e.g., Supabase auth, localStorage data).</td>
                    </tr>
                    <tr>
                      <td><strong>Third-Party Cookies</strong></td>
                      <td>Set by tools we integrate with (e.g., Razorpay, Google, Firebase).</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>5. Managing Cookies and Preferences</h2>
              <h3>a. Browser Controls</h3>
              <p>You can manage cookies through your browser settings:</p>
              <ul>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Firefox</a></li>
                <li><a href="https://support.apple.com/en-us/HT201265" target="_blank" rel="noopener noreferrer">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/help/4027947" target="_blank" rel="noopener noreferrer">Edge</a></li>
              </ul>
              <p>Note: Disabling essential cookies may prevent you from logging in or using core features.</p>

              <h3>b. Managing localStorage</h3>
              <p>Clear <code>localStorage</code> from your browser settings to reset theme or onboarding preferences.</p>

              <h3>c. Consent Mechanism (Planned)</h3>
              <p>We will implement a cookie consent banner for users in applicable jurisdictions (EU, UK, etc.) when non-essential cookies are introduced. You will be able to:</p>
              <ul>
                <li>Accept all cookies</li>
                <li>Reject all non-essential cookies</li>
                <li>Customize preferences</li>
              </ul>

              <h3>d. Do Not Track (DNT)</h3>
              <p>We currently do <strong>not</strong> respond to “Do Not Track” signals, as no consistent industry standard exists. However, we continue to monitor this for future compliance.</p>

              <h2>6. Cross-Border Data Transfers</h2>
              <p>Some data may be stored or processed outside your home country (e.g., by Supabase or Firebase in the U.S. or EU). We implement safeguards such as:</p>
              <ul>
                <li><strong>Standard Contractual Clauses (SCCs)</strong> under GDPR</li>
                <li><strong>Data Processing Agreements (DPAs)</strong> with third-party vendors</li>
                <li><strong>End-to-end encryption</strong> and <strong>access controls</strong> for secure transmission</li>
              </ul>

              <h2>7. Cookie Retention Periods</h2>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Technology</th>
                      <th>Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Supabase Cookies</td>
                      <td>Session or until logout</td>
                    </tr>
                    <tr>
                      <td>localStorage Items</td>
                      <td>Persistent until manually cleared</td>
                    </tr>
                    <tr>
                      <td>Razorpay Cookies</td>
                      <td>As per Razorpay’s fraud prevention policy</td>
                    </tr>
                    <tr>
                      <td>Google OAuth</td>
                      <td>Per Google’s privacy policy</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>You may manually clear all cookies and storage from your browser settings.</p>

              <h2>8. Children’s Privacy</h2>
              <p>ProspectFlow is not designed for users under the age of 18. We do not knowingly place cookies for children or collect their data. If we learn that we have, we will delete that information promptly to comply with <strong>COPPA</strong> (US), <strong>GDPR</strong>, and other child protection laws.</p>

              <h2>9. Accessibility</h2>
              <p>We are committed to ensuring our cookie consent tools (if used in future) are accessible, including for users who rely on:</p>
              <ul>
                <li>Screen readers</li>
                <li>Keyboard navigation</li>
                <li>Color contrast enhancements</li>
              </ul>

              <h2>10. Compliance with Global Laws</h2>
              <p>We aim to comply with the following major regulations:</p>
              <ul>
                <li><strong>GDPR</strong> (EU/EEA)</li>
                <li><strong>ePrivacy Directive</strong> (EU)</li>
                <li><strong>CCPA/CPRA</strong> (California, USA)</li>
                <li><strong>DPDPA</strong> (India)</li>
                <li><strong>LGPD</strong> (Brazil)</li>
                <li><strong>UK GDPR</strong></li>
              </ul>
              <p>You can request access, correction, or deletion of data linked to cookie usage by contacting us (see below).</p>

              <h2>11. Contact Information</h2>
              <p>📧 Email: <a href="mailto:support@prospectflow.com">support@prospectflow.com</a><br />
              🏢 Address: ProspectFlow Technologies, [Insert Registered Address Here]</p>
              <p>For users in India, this email serves as our grievance contact under the <strong>Digital Personal Data Protection Act (DPDPA)</strong>.</p>
              <p>We may appoint a <strong>Data Protection Officer (DPO)</strong> in the future if required by scale or law.</p>

              <h2>12. Changes to This Policy</h2>
              <p>We may update this policy when introducing new cookies or due to legal changes.</p>
              <ul>
                <li><strong>Last Updated</strong> date will reflect the latest version.</li>
                <li><strong>Material changes</strong> may be communicated via email or app notice.</li>
              </ul>
              <p>If you have questions or concerns about this Cookie Policy, don’t hesitate to reach out to us at <a href="mailto:support@prospectflow.com">support@prospectflow.com</a>.</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
