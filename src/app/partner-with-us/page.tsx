
'use client';

import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, Lightbulb, Users, Target, Megaphone, CheckCircle, Mail, Sparkles, RadioTower, Gift, Share2, ShieldCheck, Zap, HeartHandshake } from 'lucide-react'; // Added ShieldCheck, Zap, HeartHandshake, Target
import Link from 'next/link';
import { cn } from '@/lib/utils';

const partnershipBenefits = [
  {
    icon: Sparkles,
    title: "Spotlight Your Brand",
    description: "Team up for epic co-marketing campaigns or webinars, and let your brand dazzle our audience of ambitious go-getters. It’s like co-headlining a sold-out show—your vibe, our tools, pure magic!",
  },
  {
    icon: RadioTower,
    title: "Build Your Brand, Not Just Links",
    description: "Co-host webinars, share the stage in our blog, and position yourself as a thought leader in job search, sales, and networking tech.",
  },
  {
    icon: Gift,
    title: "Wow Your Community with Real Value",
    description: "We’ll give you exclusive perks, tools, and deals to make your audience feel like VIPs (because they are).",
  },
  {
    icon: Share2,
    title: "Tap Into Our Ecosystem",
    description: "Connect with a fast-growing global user base of professionals hungry for tools that work—and partners who get it.",
  },
];

const collaborationMethods = [
  "Co-Branded Campaigns – From Instagram Reels to full-blown webinars, let’s create together.",
  "Guest Content & Collabs – Blog swaps, podcast guesting, content collabs—we’re all ears.",
  "Perks for Your People – Sweet, exclusive deals for your followers, students, or clients.",
];

const whatWeLookFor = [
  {
    text: "You Actually Care: You’re passionate about helping professionals grow, not just collecting clicks.",
    icon: HeartHandshake,
  },
  {
    text: "You Know Your People: Your audience aligns with ours—think job seekers, sales pros, hustlers, dream-chasers.",
    icon: Target,
  },
  {
    text: "You Keep It Ethical: We don’t do spam. Neither should you. Let’s grow the right way.",
    icon: ShieldCheck,
  },
  {
    text: "You’re Hungry to Innovate: You’re curious, creative, and excited to build something bigger than just content.",
    icon: Zap,
  },
];

const partnerProfessionsMarquee = [
  { name: "Career Coaches", colorClasses: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300 border border-sky-300 dark:border-sky-600" },
  { name: "Recruitment Agencies", colorClasses: "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300 border border-purple-300 dark:border-purple-600" },
  { name: "Recruiters", colorClasses: "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border border-green-300 dark:border-green-600" },
  { name: "LinkedIn Influencers", colorClasses: "bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-300 border border-pink-300 dark:border-pink-600" },
  { name: "Podcasters", colorClasses: "bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300 border border-orange-300 dark:border-orange-600" },
  { name: "Online Educators", colorClasses: "bg-teal-100 text-teal-700 dark:bg-teal-700/30 dark:text-teal-300 border border-teal-300 dark:border-teal-600" },
  { name: "University Career Centers", colorClasses: "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600" },
  { name: "HR Tech Startups", colorClasses: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600" },
  { name: "SaaS Platforms", colorClasses: "bg-rose-100 text-rose-700 dark:bg-rose-700/30 dark:text-rose-300 border border-rose-300 dark:border-rose-600" },
  { name: "Content Creators", colorClasses: "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-600" },
  { name: "Networking Communities", colorClasses: "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-300 border border-lime-300 dark:border-lime-600" },
  { name: "Career Influencers", colorClasses: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-700/30 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-600" },
  { name: "Tech Influencers", colorClasses: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300 border border-sky-300 dark:border-sky-600" },
  { name: "Job Boards", colorClasses: "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300 border border-purple-300 dark:border-purple-600" },
  { name: "HR Tech Bloggers", colorClasses: "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border border-green-300 dark:border-green-600" },
  { name: "Professional Associations", colorClasses: "bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-300 border border-pink-300 dark:border-pink-600" },
  { name: "Business Blogs", colorClasses: "bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300 border border-orange-300 dark:border-orange-600" },
  { name: "Startup Incubators", colorClasses: "bg-teal-100 text-teal-700 dark:bg-teal-700/30 dark:text-teal-300 border border-teal-300 dark:border-teal-600" },
  { name: "Freelance Platforms", colorClasses: "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600" },
  { name: "HR Innovators", colorClasses: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600" },
  { name: "Job Board Jedis", colorClasses: "bg-rose-100 text-rose-700 dark:bg-rose-700/30 dark:text-rose-300 border border-rose-300 dark:border-rose-600" },
  { name: "Marketing Mavericks", colorClasses: "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-600" },
  { name: "Trailblazers", colorClasses: "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-300 border border-lime-300 dark:border-lime-600" },
  { name: "Sales Coaches", colorClasses: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-700/30 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-600" },
  { name: "Career Counselors", colorClasses: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300 border border-sky-300 dark:border-sky-600" },
];

const duplicatedPartnerProfessionsMarquee = [...partnerProfessionsMarquee, ...partnerProfessionsMarquee];


export default function PartnerWithUsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-[5vw] md:px-[10vw]">
          <header className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <Handshake className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 font-headline text-foreground">
              Partner with ProspectFlow
            </h1>
            <p className="text-lg text-muted-foreground">
              Let's collaborate to empower professionals worldwide with smarter outreach tools.
            </p>
          </header>

          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-10 text-foreground">
              Why partner with us
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partnershipBenefits.map((type) => (
                <Card key={type.title} className="shadow-lg hover:shadow-xl transition-shadow text-center bg-card">
                  <CardHeader className="items-center pb-3">
                    <type.icon className="h-10 w-10 text-primary mb-3" />
                    <CardTitle className="font-headline text-xl">{type.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <section className="py-16 md:py-20 overflow-hidden">
          <div className="container mx-auto px-[5vw] md:px-[10vw] text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12 font-headline text-foreground">
              Who we Partner with
            </h2>
            <div className="relative space-y-3">
              <div className="overflow-hidden whitespace-nowrap py-2">
                <div className="inline-block animate-marquee-left">
                  {duplicatedPartnerProfessionsMarquee.map((item, index) => (
                    <span key={`partner-marquee-${index}`} className={cn(`inline-flex items-center text-sm sm:text-base mx-2 px-4 py-2 rounded-lg shadow-md`, item.colorClasses)}>
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-[5vw] md:px-[10vw] pt-16 md:pt-24">
          <section className="mb-12 md:mb-16">
             <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h2 className="text-2xl md:text-3xl font-semibold font-headline mb-6 text-foreground">
                        How We Can Collaborate
                    </h2>
                    <ul className="space-y-3">
                        {collaborationMethods.map((method, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{method}</span>
                        </li>
                        ))}
                    </ul>
                </div>
                <div className="hidden md:block">
                     <img src="https://placehold.co/600x400.png" alt="Collaboration visual" className="rounded-lg shadow-md" data-ai-hint="team handshake"/>
                </div>
             </div>
          </section>

          <section className="mb-12 md:mb-16 bg-secondary/30 p-8 md:p-12 rounded-lg shadow-inner">
            <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-8 text-foreground">
              What We Look For in a Partner
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {whatWeLookFor.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="flex items-start p-4 bg-background rounded-md shadow">
                    <IconComponent className="h-6 w-6 text-accent mr-3 mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="text-center bg-primary/10 p-8 md:p-12 rounded-xl shadow-xl border border-primary/20">
            <Mail className="h-12 w-12 text-primary mx-auto mb-5" />
            <h2 className="text-3xl font-bold font-headline mb-4 text-foreground">
              Ready to Explore a Partnership?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              We're excited to hear your ideas on how we can work together. Whether you're an influencer, marketer, tech provider, or community leader, let's connect.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 shadow-md" asChild>
              <Link href="mailto:partners@prospectflow.com">
                Contact Our Partnerships Team
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Drop us a line at <strong className="text-foreground">partners@prospectflow.com</strong> with a quick intro and your boldest collaboration ideas.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Let’s make outreach unstoppable and have a blast doing it!
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

