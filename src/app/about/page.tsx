
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter'; // Added import
import { cn } from '@/lib/utils';
import { ArrowRight, Users, Zap, Focus, ShieldCheck, TrendingUp, HeartHandshake, Facebook, Twitter, Youtube, Linkedin, Globe } from 'lucide-react';

const valuesData = [
  {
    icon: <Focus className="h-10 w-10 text-primary mb-4" />,
    title: 'Simplicity & Focus',
    description: "No fluff—just clean, smart tools that reduce friction. ProspectFlow helps you skip the chaos and focus on what matters: real connections.",
    dataAiHint: "zen minimalist"
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary mb-4" />,
    title: 'Empowerment',
    description: 'We hand you the mic. With smart automations and reminders, you’re not just managing outreach—you’re fully in control.',
    dataAiHint: "growth chart"
  },
  {
    icon: <Users className="h-10 w-10 text-primary mb-4" />,
    title: 'Meaningful Connections',
    description: 'We’re not here for spam. ProspectFlow helps you build real relationships and follow up with the care they deserve.',
    dataAiHint: "people networking"
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary mb-4" />,
    title: 'Integrity & Trust',
    description: 'Your journey matters to us. With secure data and honest pricing, we’re a product—and a team—you can trust.',
    dataAiHint: "security shield"
  },
];


export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <PublicNavbar activeLink="about" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-background text-center">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6 font-headline text-foreground">
              Connecting Ambition with <span className="text-primary">Opportunity</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-md sm:text-lg md:text-xl text-muted-foreground mb-10">
              At ProspectFlow, we believe big goals need better tools.
              <br />
              We make outreach effortless, so you can focus on moving forward—not managing follow-ups.
            </p>
            <Image
              src="https://placehold.co/1200x500.png"
              alt="Diverse team collaborating"
              width={1200}
              height={500}
              className="rounded-xl shadow-2xl mx-auto object-cover"
              data-ai-hint="team collaboration"
              priority
            />
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <div className="grid md:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="md:col-span-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 font-headline text-foreground">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    ProspectFlow didn’t start in a boardroom—it began in the middle of a messy, exhausting job hunt.
                  </p>
                  <p>
                    Our founder was applying daily, tracking replies, juggling follow-ups—and quickly drowning in spreadsheets, tabs, notes apps, and reminders. He tried organizing it all: one sheet for jobs, another for companies, a calendar for follow-ups. But nothing truly worked. Managing outreach became harder than the outreach itself.
                  </p>
                  <p>
                    Desperate for structure, he built a small Python script to update his Excel sheet. Helpful? A bit. But it didn’t lift the mental load. What he really needed was something smarter—something that handled the repetitive parts and let him focus on making real progress.
                  </p>
                  <p>
                    So he started building ProspectFlow.
                  </p>
                  <p>
                    What started as a personal solution quickly revealed a bigger truth: thousands of driven professionals were stuck in the same loop—disciplined, capable, but stuck spending too much time tracking instead of connecting.
                  </p>
                  <p>
                    ProspectFlow became his answer to that. A platform simple enough for a college student, and powerful enough for a seasoned executive. One place to manage outreach, never miss a follow-up, and keep every opportunity moving forward—with zero spreadsheet gymnastics.
                  </p>
                  <p>
                    That’s where it started. And we’re just getting warmed up.
                  </p>
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-xl shadow-xl overflow-hidden md:col-span-4">
                <Image
                  src="https://placehold.co/600x450.png"
                  alt="Founders brainstorming or early product sketch"
                  width={600}
                  height={450}
                  className="object-cover w-full h-full"
                  data-ai-hint="brainstorming session"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-[5vw] md:px-[10vw] text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 font-headline text-foreground">
              Our Mission & Vision
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="text-left p-6 border border-border rounded-lg shadow-lg bg-card">
                <Zap className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-semibold mb-3 font-headline text-foreground">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To equip professionals with the most intuitive, efficient, and empowering tools for managing outreach, building strong networks, and hitting big goals—without the usual chaos.
                </p>
              </div>
              <div className="text-left p-6 border border-border rounded-lg shadow-lg bg-card">
                <HeartHandshake className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-semibold mb-3 font-headline text-foreground">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become the go-to platform for professionals worldwide who want to unlock their full potential through smarter, more intentional outreach.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-headline text-foreground">
              The Values That Guide Us
            </h2>
            <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
              These principles are our compass—whether we&apos;re building a feature or replying to your email at midnight <strong className="font-semibold">(yes, we see you, night owls)</strong>.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {valuesData.map((value) => (
                <Card key={value.title} className="text-center shadow-lg hover:shadow-xl transition-shadow bg-card">
                  <CardHeader className="items-center pb-3">
                    {React.cloneElement(value.icon)}
                    <CardTitle className="font-headline text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 text-center bg-primary/90 text-primary-foreground">
          <div className="container mx-auto px-[5vw] md:px-[10vw]">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-8 font-headline">
              Ready to Transform Your Outreach?
            </h2>
            <p className="max-w-xl mx-auto text-md sm:text-lg mb-10 opacity-90">
              Join thousands of professionals who are tracking their followups and achieving their goals with ProspectFlow.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-xl bg-background text-primary hover:bg-background/90 font-semibold rounded-full"
              asChild
            >
              <Link href="/auth?action=signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
