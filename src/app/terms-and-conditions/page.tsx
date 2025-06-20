
'use client';

import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  const staticDate = "June 12, 2025";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-[5vw] md:px-[10vw]">
          <header className="mb-12 text-center">
            <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter font-headline text-foreground">
              Terms and Conditions
            </h1>
          </header>

          <Card className="shadow-lg">
            <CardContent className="prose prose-sm dark:prose-invert max-w-none py-8 px-6 md:px-8 space-y-6">
              <p><strong>Last Updated:</strong> {staticDate}</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction & Acceptance of Terms</h2>
              <p>Welcome to <strong>ProspectFlow</strong> — your job application and follow-up management assistant. These Terms and Conditions ("<strong>Terms</strong>") form a legally binding agreement between you ("<strong>you</strong>", "<strong>your</strong>", or "<strong>User</strong>") and <strong>ProspectFlow Inc.</strong> ("<strong>ProspectFlow</strong>", "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") and govern your use of the ProspectFlow web and mobile applications, website, and related services (collectively, the "<strong>Service</strong>").</p>
              <p>By using our Service, you accept these Terms and our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, which is incorporated by reference. If you do not agree, do not use the Service.</p>
              <p>You must be <strong>at least 18 years old</strong> to access or use ProspectFlow.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">2. Account Registration & Security</h2>
              <ul>
                <li>You must create an account to use certain features.</li>
                <li>You agree to provide accurate, complete information and keep it updated.</li>
                <li>You’re responsible for safeguarding your credentials and any activity under your account.</li>
                <li>Only one account per user is permitted.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">3. The Service</h2>
              <p>ProspectFlow helps users track job applications, schedule follow-ups, organize communication, tag applications, and manage cadences. We grant you a <strong>limited, revocable, non-exclusive, non-transferable</strong> license to use the Service as per these Terms.</p>
              <p>We reserve the right to modify, suspend, or discontinue any part of the Service at our sole discretion.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">4. User-Generated Content</h2>
              <h3 className="text-lg font-semibold mt-4 mb-2">a. Ownership & Rights</h3>
              <p>You retain ownership of all content you input into the Service (“<strong>User Content</strong>”). By uploading content, you grant us a <strong>worldwide, royalty-free, non-exclusive, sublicensable license</strong> to use, display, and process your content solely for providing and improving the Service.</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">b. User Responsibilities</h3>
              <p>You confirm you own or have legal rights to all content you upload. You’re solely responsible for any consequences of posting it.</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">c. Content Restrictions</h3>
              <p>You may not upload content that is unlawful, defamatory, abusive, harmful, or infringes on others' rights.</p>

              <h3 className="text-lg font-semibold mt-4 mb-2">d. DMCA and Infringement Claims</h3>
              <p>If you believe your copyrighted work has been used inappropriately, please send a takedown request to <a href="mailto:legal@prospectflow.com" className="text-primary hover:underline">legal@prospectflow.com</a> in accordance with the <a href="https://www.copyright.gov/dmca/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DMCA</a>.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">5. Fees, Payment & Subscriptions</h2>
              <ul>
                <li>Subscription plans are available in Free and Premium tiers.</li>
                <li>Payments are processed via <strong>Razorpay</strong>. You agree to Razorpay’s terms.</li>
                <li>All fees are in <strong>INR</strong> unless specified otherwise.</li>
                <li>Subscriptions <strong>auto-renew</strong> unless canceled at least <strong>24 hours before the end of the billing cycle</strong>.</li>
                <li>You may cancel from your account settings or contact support.</li>
                <li><strong>No refunds</strong> will be provided unless otherwise required by law.</li>
                <li>You’re responsible for applicable taxes.</li>
                <li><strong>Free Tier Limitations</strong>: Usage restrictions apply. Exceeding limits may prevent new entries.</li>
                <li><strong>Grace Periods</strong>: If payment fails, a grace period (typically 3 days) applies before feature restrictions begin.</li>
              </ul>
              <p><strong>California users</strong>: As required by <strong>AB 390</strong>, auto-renewal terms and cancellation rights are clearly disclosed here.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">6. Intellectual Property</h2>
              <ul>
                <li>The ProspectFlow Service, its content (excluding User Content), trademarks, and branding are owned by ProspectFlow Inc. and protected by law.</li>
                <li>Use of our name or logo requires our prior written permission.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">7. Prohibited Conduct</h2>
              <p>You may not:</p>
              <ul>
                <li>Violate any applicable laws or third-party rights.</li>
                <li>Post harmful, illegal, or infringing content.</li>
                <li>Impersonate others or misrepresent affiliations.</li>
                <li>Interfere with the integrity or performance of the Service.</li>
                <li>Use bots or scraping tools without written permission.</li>
                <li>Reverse-engineer or modify any part of the Service.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">8. Third-Party Services & Links</h2>
              <p>We use and may link to third-party platforms like <strong>Razorpay</strong>, <strong>Firebase</strong>, and <strong>Supabase</strong>. Your use of such platforms is at your own risk and subject to their respective terms and privacy policies.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">9. Termination</h2>
              <ul>
                <li>You may terminate your account anytime through account settings or by emailing <a href="mailto:support@prospectflow.com" className="text-primary hover:underline">support@prospectflow.com</a>.</li>
                <li>We may suspend or terminate your access immediately for violating these Terms.</li>
                <li>Upon termination, your license to use the Service ceases, but rights that should survive (e.g., liability limitations) will continue.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">10. Disclaimer of Warranties</h2>
              <p><strong>THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.”</strong></p>
              <p>We disclaim all warranties, express or implied, including those of <strong>merchantability</strong>, <strong>fitness for a particular purpose</strong>, and <strong>non-infringement</strong>. We don’t guarantee uninterrupted service or error correction.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">11. Limitation of Liability</h2>
              <p>To the <strong>maximum extent permitted by law</strong>, ProspectFlow shall not be liable for any indirect, incidental, or consequential damages, including loss of data, revenue, or goodwill.</p>
              <p><strong>Total liability shall not exceed INR ₹8,000 or the amount paid by you in the last three (3) months</strong>, whichever is higher.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">12. Indemnification</h2>
              <p>You agree to indemnify and hold ProspectFlow and its affiliates, agents, and employees harmless from any claims, damages, or liabilities arising from:</p>
              <ul>
                <li>Your use of the Service.</li>
                <li>Content you post.</li>
                <li>Your violation of these Terms.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">13. Governing Law & Dispute Resolution</h2>
              <p>These Terms are governed by the laws of the <strong>State of California, USA</strong>, excluding conflict of law rules.</p>
              <h3 className="text-lg font-semibold mt-4 mb-2">Dispute Process:</h3>
              <ul>
                <li>First, try to resolve disputes with us <strong>informally</strong> by contacting <a href="mailto:legal@prospectflow.com" className="text-primary hover:underline">legal@prospectflow.com</a>.</li>
                <li>If unresolved, disputes will be submitted to <strong>binding arbitration</strong> under the <strong>American Arbitration Association (AAA)</strong> in <strong>San Francisco, California</strong>, in English.</li>
                <li><strong>Class actions are waived</strong> — you may only bring individual claims.</li>
              </ul>
              <p><strong>Note for Indian users</strong>: We comply with India's <strong>DPDPA</strong>. You may reach our <strong>Grievance Officer</strong> at <a href="mailto:grievance@prospectflow.com" className="text-primary hover:underline">grievance@prospectflow.com</a>.</p>
              <p><strong>Note for EU users</strong>: You have a <strong>14-day right to withdraw</strong> from paid subscriptions under the <strong>EU Consumer Rights Directive</strong>. Contact <a href="mailto:support@prospectflow.com" className="text-primary hover:underline">support@prospectflow.com</a> to cancel.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">14. Changes to These Terms</h2>
              <p>We may update these Terms at our sole discretion. If we make material changes, we’ll provide <strong>at least 30 days' notice</strong> via email or our app.</p>
              <p>Continued use after updates means you accept the revised Terms.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">15. Accessibility</h2>
              <p>We’re committed to making ProspectFlow accessible for all users, including those with disabilities, in accordance with the <strong>Americans with Disabilities Act (ADA)</strong> and the <strong>EU Web Accessibility Directive</strong>. If you encounter accessibility issues, contact <a href="mailto:accessibility@prospectflow.com" className="text-primary hover:underline">accessibility@prospectflow.com</a>.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">16. Force Majeure</h2>
              <p>We’re not liable for delays or failures due to events beyond our control, including but not limited to <strong>natural disasters, war, cyberattacks, outages, or labor disputes</strong>.</p>

              <h2 className="text-xl font-semibold mt-6 mb-3">17. Miscellaneous</h2>
              <ul>
                <li><strong>Entire Agreement</strong>: These Terms and the Privacy Policy form the entire agreement.</li>
                <li><strong>Severability</strong>: If any part is unenforceable, the rest remains in effect.</li>
                <li><strong>Waiver</strong>: Failure to enforce a right isn’t a waiver.</li>
                <li><strong>Assignment</strong>: You may not transfer your rights; we may assign ours.</li>
                <li><strong>Headings</strong>: Are for convenience only and have no legal effect.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-3">18. Contact Information</h2>
              <ul>
                <li><strong>Email</strong>: <a href="mailto:support@prospectflow.com" className="text-primary hover:underline">support@prospectflow.com</a></li>
                <li><strong>Grievance Contact</strong>: <a href="mailto:grievance@prospectflow.com" className="text-primary hover:underline">grievance@prospectflow.com</a></li>
                <li><strong>Legal Inquiries</strong>: <a href="mailto:legal@prospectflow.com" className="text-primary hover:underline">legal@prospectflow.com</a></li>
                <li><strong>Mailing Address</strong>:<br />
                  ProspectFlow Inc.<br />
                  123 Prospect Lane<br />
                  San Francisco, CA 94105<br />
                  United States
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
