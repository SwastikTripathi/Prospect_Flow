
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, type ButtonProps } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Loader2, CreditCard, HelpCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import type { UserSubscription, AvailablePlan, SubscriptionTier, SubscriptionStatus, InvoiceData, InvoiceRecord } from '@/lib/types';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/razorpayActions';
import { addMonths, isFuture, format } from 'date-fns';
import { ALL_AVAILABLE_PLANS } from '@/lib/config';
import { cn } from '@/lib/utils';
import { generateInvoicePdf } from '@/lib/invoiceGenerator';
// import { AskForNameDialog } from '@/components/AskForNameDialog'; // Keep this line for the new dialog
import { useCurrentSubscription } from '@/hooks/use-current-subscription';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserDataCache } from '@/contexts/UserDataCacheContext';
import { useAuth } from '@/contexts/AuthContext';
import { AskForNameDialog } from '@/components/AskForNameDialog'; // Ensure correct import path

const NEXT_PUBLIC_RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

interface PlanDisplayInfo {
  isFree: boolean;
  isDiscounted: boolean;
  originalTotalPrice?: number;
  discountedPricePerMonth?: number;
  finalTotalPrice: number;
  priceMonthlyDirect?: number;
  durationMonths: number;
  discountPercentage?: number;
}

interface PendingInvoiceContext {
  plan: AvailablePlan;
  paymentId: string;
  orderId: string;
  finalAmountPaid: number;
  invoiceNumber: string;
}

const faqData = [
  {
    question: "What’s included in the free plan?",
    answer: "Everything! You get full feature access — just with limits on job openings, contacts, and companies. No credit card needed."
  },
  {
    question: "How is the premium plan different?",
    answer: "Same features, but higher limits. Great for when you're handling a bigger job hunt or outreach pipeline."
  },
  {
    question: "Can I try the premium plan before subscribing?",
    answer: "Yes! Our free plan includes all premium features, so you can explore everything before deciding to upgrade."
  },
  {
    question: "Will my data be saved if I upgrade later?",
    answer: "Absolutely. All your data — job leads, contacts, notes, templates — stays right where you left it."
  },
  {
    question: "Can I cancel my premium plan anytime?",
    answer: "You can choose not to renew, but we currently do not offer refunds for payments already made. So be sure before upgrading."
  },
  {
    question: "What happens when I reach the free plan limits?",
    answer: "We’ll notify you. You can still access your data, but to add more entries, you’ll need to upgrade."
  },
  {
    question: "Are payments secure?",
    answer: "Yes. We use trusted payment processors (like Razorpay) and never store your card details ourselves."
  },
  {
    question: "Do you offer refunds or pro-rated cancellations?",
    answer: "No, we do not offer refunds once a payment is made — including mid-period cancellations. Please try the free tier first to ensure it fits your workflow."
  },
  {
    question: "Can I change my plan duration later?",
    answer: "Yes — you can extend your plan anytime. Whether you're on a monthly plan or already subscribed for longer, you can upgrade to a 6-month or 12-month plan whenever it suits you."
  },
  {
    question: "Is ProspectFlow only for job seekers?",
    answer: "Not at all. Freelancers, founders, and anyone doing structured outreach and follow-ups can benefit."
  }
];


export default function BillingPage() {
  const { user: currentUser } = useAuth();
  const {
    currentSubscription,
    subscriptionLoading,
    effectiveTierForLimits,
    isInGracePeriod,
    daysLeftInGracePeriod,
    refetchSubscription,
  } = useCurrentSubscription();
  const { addCachedInvoice, updateCachedUserSubscription } = useUserDataCache();


  const [isLoadingAuthAndInitialSub, setIsLoadingAuthAndInitialSub] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const [isAskNameDialogOpen, setIsAskNameDialogOpen] = useState(false);
  const [pendingInvoiceContext, setPendingInvoiceContext] = useState<PendingInvoiceContext | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        toast({
            title: "Razorpay Misconfiguration",
            description: "Razorpay Key ID is not properly set up. Payments may not function.",
            variant: "destructive",
            duration: 10000,
        });
    }
    setIsLoadingAuthAndInitialSub(subscriptionLoading);
  }, [toast, subscriptionLoading]);


  const calculatePlanDisplayInfo = (plan: AvailablePlan): PlanDisplayInfo => {
    if (plan.databaseTier === 'free') {
      return {
        isFree: true,
        isDiscounted: false,
        finalTotalPrice: 0,
        durationMonths: plan.durationMonths,
      };
    }

    const originalTotal = plan.priceMonthly * plan.durationMonths;
    let finalTotal = originalTotal;
    let discountedPerMonth;

    if (plan.discountPercentage && plan.discountPercentage > 0) {
      const discountAmount = originalTotal * (plan.discountPercentage / 100);
      finalTotal = originalTotal - discountAmount;
      discountedPerMonth = Math.round(finalTotal / plan.durationMonths);
      return {
        isFree: false,
        isDiscounted: true,
        originalTotalPrice: Math.round(originalTotal),
        discountedPricePerMonth: discountedPerMonth,
        finalTotalPrice: Math.round(finalTotal),
        durationMonths: plan.durationMonths,
        discountPercentage: plan.discountPercentage,
      };
    } else {
      return {
        isFree: false,
        isDiscounted: false,
        priceMonthlyDirect: plan.priceMonthly,
        finalTotalPrice: Math.round(originalTotal),
        durationMonths: plan.durationMonths,
      };
    }
  };

  const proceedToGenerateInvoiceAndSaveRecord = async (
    userNameForInvoice: string, // Changed to accept name
    context: PendingInvoiceContext   // Changed to accept context
  ) => {
    if (!currentUser || !context) return; // Check context as well
    console.log('[BillingPage] proceedToGenerateInvoiceAndSaveRecord: Starting invoice generation and DB save with name:', userNameForInvoice);

    const { plan, paymentId, orderId, finalAmountPaid, invoiceNumber } = context;

    const yourCompanyName = "ProspectFlow Inc.";
    const yourCompanyAddress = "123 Innovation Drive, Tech City, ST 54321";
    const yourCompanyContact = "contact@prospectflow.com";
    const yourCompanyLogoUrl = "https://placehold.co/200x80.png?text=Your+Logo";

    const invoiceData: InvoiceData = {
      invoiceNumber: invoiceNumber,
      invoiceDate: format(new Date(), 'PPP'),
      userName: userNameForInvoice, // Use the passed name
      userEmail: currentUser?.email || 'N/A',
      planName: plan.name,
      planPrice: finalAmountPaid,
      paymentId: paymentId,
      orderId: orderId,
      companyName: yourCompanyName,
      companyAddress: yourCompanyAddress,
      companyContact: yourCompanyContact,
      companyLogoUrl: yourCompanyLogoUrl,
    };

    try {
      generateInvoicePdf(invoiceData);
      console.log('[BillingPage] Invoice PDF generated.');
    } catch (pdfError: any) {
      toast({
        title: 'Invoice PDF Generation Failed',
        description: `Could not generate PDF: ${pdfError.message}. Your subscription is active. Please contact support for an invoice.`,
        variant: 'destructive',
        duration: 10000,
      });
    }

    const invoiceRecord: InvoiceRecord = {
      user_id: currentUser.id,
      invoice_number: invoiceNumber,
      plan_id: plan.id,
      plan_name: plan.name,
      amount_paid: finalAmountPaid,
      currency: 'INR',
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
    };

    try {
      const { data: savedInvoice, error: dbError } = await supabase.from('invoices').insert(invoiceRecord).select().single();
      if (dbError) {
        throw dbError;
      }
      if (savedInvoice) {
        console.log('[BillingPage] Invoice record saved to DB. Updating cache.');
        addCachedInvoice({
            ...savedInvoice,
            invoice_date: format(new Date(savedInvoice.invoice_date), 'PPP'),
            created_at: savedInvoice.created_at,
        });
      }
      toast({
        title: 'Invoice Record Saved',
        description: 'Your invoice details have been saved to our records.',
        duration: 5000,
      });
    } catch (saveError: any) {
      toast({
        title: 'Failed to Save Invoice Record',
        description: `PDF generated, but failed to save record: ${saveError.message}. Please contact support if you need this record.`,
        variant: 'destructive',
        duration: 10000,
      });
    }
  };

  const handleNameSubmittedForInvoice = async (submittedName: string) => {
    if (!currentUser || !pendingInvoiceContext) {
      toast({ title: 'Error', description: 'User or payment context missing.', variant: 'destructive' });
      setIsAskNameDialogOpen(false);
      return;
    }
    console.log('[BillingPage] Name submitted for invoice:', submittedName);

    // Directly proceed to invoice generation with the submitted name
    // No database update for the user's name as per requirement
    await proceedToGenerateInvoiceAndSaveRecord(submittedName, pendingInvoiceContext);

    setIsAskNameDialogOpen(false);
    setPendingInvoiceContext(null);
  };


  const handleSuccessfulPaymentAndSubscription = async (
    plan: AvailablePlan,
    paymentId: string,
    orderId: string,
    finalAmountPaid: number
  ) => {
    if (!currentUser) return;
    console.log('[BillingPage] Payment successful. Plan:', plan.name, 'Payment ID:', paymentId);

    console.log('[BillingPage] Refetching subscription after successful payment.');
    await refetchSubscription();

    const invoiceNumber = `INV-${format(new Date(), 'yyyyMMdd')}-${orderId.slice(-6)}`;

    // Store context and open dialog
    setPendingInvoiceContext({ plan, paymentId, orderId, finalAmountPaid, invoiceNumber });
    setIsAskNameDialogOpen(true);
    toast({
        title: 'Payment Confirmed!',
        description: 'Please confirm the name for your invoice.',
        duration: 7000,
    });
  };

  const handleSelectPlan = async (plan: AvailablePlan) => {
    if (!currentUser) {
      toast({ title: 'Not Logged In', description: 'Please log in to select a plan.', variant: 'destructive'});
      return;
    }
    console.log('[BillingPage] handleSelectPlan called for plan:', plan.name);

    const isAlreadyEffectivelyOnThisDbTier = currentSubscription?.tier === plan.databaseTier && effectiveTierForLimits === plan.databaseTier;

    if (plan.databaseTier === 'premium' && isAlreadyEffectivelyOnThisDbTier && effectiveTierForLimits === 'premium') {
      console.log('[BillingPage] User is already on a premium plan, this is an extension/change.');
    } else if (plan.databaseTier === 'free' && effectiveTierForLimits === 'free' && !isInGracePeriod) {
      toast({ title: 'Plan Active', description: `You are already on the ${plan.name}.`, variant: 'default' });
      return;
    }

    setProcessingPlanId(plan.id);
    setIsProcessingPayment(true);
    console.log('[BillingPage] Starting payment processing for plan:', plan.id);

    try {
      let newStartDate: Date;
      let newExpiryDate: Date;

      const isUserCurrentlyOnActivePremium =
        effectiveTierForLimits === 'premium' &&
        currentSubscription &&
        currentSubscription.plan_expiry_date &&
        isFuture(new Date(currentSubscription.plan_expiry_date));

      if (plan.databaseTier === 'premium' && isUserCurrentlyOnActivePremium && currentSubscription?.plan_start_date && currentSubscription?.plan_expiry_date) {
        newStartDate = new Date(currentSubscription.plan_start_date);
        newExpiryDate = addMonths(new Date(currentSubscription.plan_expiry_date), plan.durationMonths);
        console.log('[BillingPage] Extending existing premium. New expiry:', newExpiryDate);
      } else {
        newStartDate = new Date();
        newExpiryDate = addMonths(newStartDate, plan.durationMonths);
        console.log('[BillingPage] New subscription or upgrade from free. Start:', newStartDate, 'Expiry:', newExpiryDate);
      }

      if (plan.databaseTier === 'free') {
        console.log('[BillingPage] Processing free plan activation.');
        const { data: upsertedSub, error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: currentUser.id,
            tier: 'free',
            plan_start_date: newStartDate.toISOString(),
            plan_expiry_date: newExpiryDate.toISOString(),
            status: 'active' as SubscriptionStatus,
            razorpay_order_id: null,
            razorpay_payment_id: null,
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (upsertError) throw new Error(upsertError.message || 'Failed to activate free plan.');
        toast({ title: 'Plan Activated!', description: `You are now on the ${plan.name}.` });
        if (upsertedSub) {
            console.log('[BillingPage] Free plan DB upsert successful. Updating cache.');
            updateCachedUserSubscription({
                ...upsertedSub,
                tier: upsertedSub.tier as SubscriptionTier,
                status: upsertedSub.status as SubscriptionStatus,
                plan_start_date: upsertedSub.plan_start_date ? new Date(upsertedSub.plan_start_date) : null,
                plan_expiry_date: upsertedSub.plan_expiry_date ? new Date(upsertedSub.plan_expiry_date) : null,
            });
        }
      } else {
        if (!NEXT_PUBLIC_RAZORPAY_KEY_ID) {
            throw new Error("Razorpay Key ID is not configured. Payment cannot proceed.");
        }
        console.log('[BillingPage] Processing premium plan payment via Razorpay.');

        const priceInfo = calculatePlanDisplayInfo(plan);
        const finalAmountForPayment = priceInfo.finalTotalPrice;

        const orderPayload = {
          amount: Math.round(finalAmountForPayment * 100),
          currency: 'INR',
          receipt: `pf_${plan.id}_${Date.now()}`,
          notes: {
            purchaseOptionId: plan.id,
            mapsToDbTier: plan.databaseTier,
            userId: currentUser.id,
            userName: currentUser.user_metadata?.full_name || currentUser.email || 'User',
            userEmail: currentUser.email || 'N/A',
            durationMonths: plan.durationMonths
          }
        };
        const orderData = await createRazorpayOrder(orderPayload);
        console.log('[BillingPage] Razorpay order created:', orderData.order_id);

        if (!orderData || orderData.error || !orderData.order_id) {
          throw new Error(orderData?.error || 'Failed to create Razorpay order.');
        }

        const options = {
          key: NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "ProspectFlow",
          description: `${plan.name}`,
          order_id: orderData.order_id,
          handler: async function (response: any) {
            setProcessingPlanId(plan.id);
            setIsProcessingPayment(true);
            console.log('[BillingPage] Razorpay payment handler invoked. Response:', response.razorpay_payment_id);
            try {
              const verificationResult = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verificationResult.success) {
                console.log('[BillingPage] Payment verification successful. Updating DB subscription.');
                const { data: upsertedSub, error: upsertError } = await supabase
                  .from('user_subscriptions')
                  .upsert({
                    user_id: currentUser!.id,
                    tier: 'premium',
                    plan_start_date: newStartDate.toISOString(),
                    plan_expiry_date: newExpiryDate.toISOString(),
                    status: 'active' as SubscriptionStatus,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                  }, { onConflict: 'user_id' })
                  .select()
                  .single();

                 if (upsertError) throw new Error(upsertError.message || 'Failed to update subscription after payment.');
                // Toast for payment success is handled by the name dialog trigger now
                if (upsertedSub) {
                    console.log('[BillingPage] Premium plan DB upsert successful. Updating cache.');
                    updateCachedUserSubscription({
                        ...upsertedSub,
                        tier: upsertedSub.tier as SubscriptionTier,
                        status: upsertedSub.status as SubscriptionStatus,
                        plan_start_date: upsertedSub.plan_start_date ? new Date(upsertedSub.plan_start_date) : null,
                        plan_expiry_date: upsertedSub.plan_expiry_date ? new Date(upsertedSub.plan_expiry_date) : null,
                    });
                }
                await handleSuccessfulPaymentAndSubscription(plan, response.razorpay_payment_id, response.razorpay_order_id, finalAmountForPayment);
              } else {
                toast({ title: 'Payment Verification Failed', description: verificationResult.error || 'Please contact support.', variant: 'destructive' });
              }
            } catch (handlerError: any) {
               toast({ title: 'Error Updating Subscription', description: handlerError.message || 'Could not update your subscription after payment.', variant: 'destructive' });
            } finally {
                console.log('[BillingPage] Razorpay handler finished.');
                setIsProcessingPayment(false);
                setProcessingPlanId(null);
            }
          },
          prefill: {
            name: currentUser.user_metadata?.full_name || currentUser.email,
            email: currentUser.email,
          },
          theme: {
            color: "#673AB7"
          },
          modal: {
            ondismiss: function() {
              console.log('[BillingPage] Razorpay modal dismissed.');
              setIsProcessingPayment(false);
              setProcessingPlanId(null);
            }
          }
        };
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any){
            toast({
                title: 'Payment Failed',
                description: `Code: ${response.error.code}, Reason: ${response.error.description || response.error.reason}`,
                variant: 'destructive'
            });
            console.log('[BillingPage] Razorpay payment failed.');
            setIsProcessingPayment(false);
            setProcessingPlanId(null);
        });
        console.log('[BillingPage] Opening Razorpay checkout.');
        rzp.open();
        return;
      }
    } catch (error: any) {
      console.error('[BillingPage] Error in handleSelectPlan:', error);
      toast({ title: 'Error Processing Plan', description: error.message || 'Could not process your request.', variant: 'destructive' });
    }
    setIsProcessingPayment(false);
    setProcessingPlanId(null);
  };

  const displayedPlans = ALL_AVAILABLE_PLANS.map((plan) => {
    const priceInfo = calculatePlanDisplayInfo(plan);
    const isCurrentlySelectedProcessing = processingPlanId === plan.id && isProcessingPayment;
    const isUserOnActivePremium = effectiveTierForLimits === 'premium' && currentSubscription?.status === 'active' && currentSubscription.plan_expiry_date && isFuture(new Date(currentSubscription.plan_expiry_date));

    let ctaButtonContent: React.ReactNode = plan.publicCtaText;
    let finalButtonIsDisabled = isCurrentlySelectedProcessing;
    let finalButtonVariant: ButtonProps['variant'] = (plan.isPopular && plan.databaseTier === 'premium') ? 'default' : 'secondary';

    if (plan.databaseTier === 'free') {
        if (isUserOnActivePremium) {
            ctaButtonContent = <span className="font-bold">Premium Active</span>;
            finalButtonIsDisabled = true;
            finalButtonVariant = 'outline';
        } else if (effectiveTierForLimits === 'free' && !isInGracePeriod) {
            ctaButtonContent = <span className="font-bold">Current Plan</span>;
            finalButtonIsDisabled = true;
            finalButtonVariant = 'outline';
        } else {
             ctaButtonContent = plan.publicCtaText;
             finalButtonVariant = 'secondary';
        }
    } else {
        if (plan.isPopular) {
            finalButtonVariant = 'default';
        } else {
            finalButtonVariant = 'secondary';
        }
    }

    if (isCurrentlySelectedProcessing) {
        finalButtonIsDisabled = true;
    }

    return {
      ...plan,
      priceInfo,
      finalButtonIsDisabled,
      ctaButtonContent,
      finalButtonVariant,
    };
  });

  let currentPlanCardTitle = "N/A";
  let currentPlanCardStatus = "N/A";
  let currentPlanCardContent: React.ReactNode = null;

  if (!isLoadingAuthAndInitialSub) {
    if (effectiveTierForLimits === 'premium' && currentSubscription?.status === 'active' && currentSubscription.plan_expiry_date && isFuture(new Date(currentSubscription.plan_expiry_date))) {
      currentPlanCardTitle = "Premium Plan";
      currentPlanCardStatus = "Active";
      currentPlanCardContent = (
        <>
          {currentSubscription.plan_start_date && (
            <p>Valid From: {format(new Date(currentSubscription.plan_start_date), 'PPP')}</p>
          )}
          {currentSubscription.plan_expiry_date && (
            <p>Valid Until: {format(new Date(currentSubscription.plan_expiry_date), 'PPP')}</p>
          )}
          {currentSubscription.razorpay_order_id && (
            <p className="text-xs text-muted-foreground mt-1">Last Order ID: {currentSubscription.razorpay_order_id}</p>
          )}
        </>
      );
    } else {
      currentPlanCardTitle = "Free Tier";
      if (isInGracePeriod) {
        currentPlanCardStatus = "Grace Period";
        currentPlanCardContent = (
          <div className="text-sm text-destructive space-y-1 bg-destructive/10 p-3 rounded-md border border-destructive/20">
            <div className="flex items-center font-semibold">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Premium Plan Ended
            </div>
            <p>
              You have {daysLeftInGracePeriod} day{daysLeftInGracePeriod !== 1 ? 's' : ''} remaining in your grace period.
            </p>
            <p>
              Please <Button variant="link" className="p-0 h-auto text-destructive hover:underline" onClick={() => handleSelectPlan(ALL_AVAILABLE_PLANS.find(p => p.id === 'premium-1m')!)}>renew your premium subscription</Button> or manage your data to fit Free Tier limits.
            </p>
            <p className="text-xs">
              After this period, data exceeding Free Tier limits may be automatically removed.
            </p>
          </div>
        );
      } else {
        currentPlanCardStatus = "Active";
        currentPlanCardContent = (
          <p className="text-sm text-muted-foreground">
            You are currently on the Free Tier. Upgrade to Premium for more features and higher limits.
          </p>
        );
      }
    }
  }
  console.log('[BillingPage] Current subscription loading state:', isLoadingAuthAndInitialSub);

  if (isLoadingAuthAndInitialSub) {
    console.log('[BillingPage] Auth/initial sub loading, showing main spinner.');
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center">
            <CreditCard className="mr-3 h-7 w-7 text-primary" />
            Billing & Plan
          </h2>
          <p className="text-muted-foreground">Manage your subscription and billing details.</p>
        </div>

        {(isLoadingAuthAndInitialSub || subscriptionLoading) && !currentSubscription ? (
             <Card className="shadow-lg">
                <CardHeader><CardTitle className="font-headline text-xl text-primary">Loading current plan...</CardTitle></CardHeader>
                <CardContent><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent>
             </Card>
        ): (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">Your Current Plan: {currentPlanCardTitle}</CardTitle>
              <CardDescription>
                  Status: <span className={`font-semibold ${
                      currentPlanCardStatus === 'Active' && effectiveTierForLimits === 'premium' ? 'text-green-600'
                      : currentPlanCardStatus === 'Active' && effectiveTierForLimits === 'free' ? 'text-green-600'
                      : (currentPlanCardStatus === 'Cancelled' || currentPlanCardStatus === 'Expired' || currentPlanCardStatus === 'Grace Period') ? 'text-red-600'
                      : 'text-muted-foreground'
                  }`}>
                  {currentPlanCardStatus}
                  </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentPlanCardContent}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayedPlans.map((plan) => {
            const { priceInfo } = plan;

            return (
            <Card key={plan.id} className={cn(
                "flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 relative",
                plan.isPopular && plan.databaseTier === 'premium' ? 'border-primary border-2' : ''
            )}>
              {plan.isPopular && plan.databaseTier === 'premium' && (
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground text-xs font-semibold py-1 px-3 rounded-full shadow-md">
                    Most Popular
                    </div>
                </div>
              )}
              <CardHeader className={cn("pb-4")}>
                <CardTitle className="font-headline text-2xl leading-tight">
                  {plan.displayNameLines.map((line, idx) => <div key={idx}>{line}</div>)}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <div className="text-4xl font-bold mb-1 min-h-[3rem] flex items-baseline">
                  {priceInfo.isFree ? (
                    "Free"
                  ) : priceInfo.isDiscounted && priceInfo.discountedPricePerMonth ? (
                    <div className="flex items-baseline flex-wrap gap-x-1.5">
                      <div className="flex items-baseline">
                        <span className="font-normal" style={{ fontFamily: 'Arial' }}>₹</span>
                        <span className="font-bold">{priceInfo.discountedPricePerMonth}</span>
                        <span className="text-base font-normal text-muted-foreground self-end">/mo</span>
                      </div>
                      {priceInfo.discountPercentage && (
                        <span className="text-sm font-semibold text-green-600">
                          ({priceInfo.discountPercentage}% off)
                        </span>
                      )}
                    </div>
                  ) : (
                    priceInfo.priceMonthlyDirect && (
                        <div className="flex items-baseline">
                        <span className="font-normal" style={{ fontFamily: 'Arial' }}>₹</span>
                        <span className="font-bold">{priceInfo.priceMonthlyDirect}</span>
                        <span className="text-base font-normal text-muted-foreground self-end">/mo</span>
                        </div>
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground min-h-[1.5em]">
                  {!priceInfo.isFree ?
                   ( <>Total: <span className="font-normal" style={{ fontFamily: 'Arial' }}>₹</span><span className="font-bold">{priceInfo.finalTotalPrice}</span> for {priceInfo.durationMonths} month{priceInfo.durationMonths > 1 ? 's' : ''}</> )
                   : "Forever!"
                  }
                </p>

                <ul className="space-y-2 text-sm pt-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className={`flex items-center ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {feature.included ? <CheckCircle className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" /> : <Circle className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={plan.finalButtonIsDisabled || (isProcessingPayment && processingPlanId === plan.id) || subscriptionLoading || isLoadingAuthAndInitialSub}
                  variant={plan.finalButtonVariant}
                >
                  {((isProcessingPayment && processingPlanId === plan.id) || subscriptionLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {plan.ctaButtonContent}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        </div>
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5 text-primary"/>Frequently Asked Questions
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
                <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem value={`item-${index + 1}`} key={index} className="border-b bg-transparent shadow-none rounded-none first:border-t">
                    <AccordionTrigger className="px-0 py-3 text-left font-semibold text-foreground hover:no-underline text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-3 text-muted-foreground text-sm">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
        </Card>
      </div>
      {currentUser && (
        <AskForNameDialog
          isOpen={isAskNameDialogOpen}
          onOpenChange={setIsAskNameDialogOpen}
          onSubmitName={handleNameSubmittedForInvoice}
          currentName={currentUser.user_metadata?.full_name}
          currentEmail={currentUser.email}
        />
      )}
    </AppLayout>
  );
}
