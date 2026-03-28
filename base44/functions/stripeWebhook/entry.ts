import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const orgId = session.metadata.organization_id;
                const plan = session.metadata.plan;

                const planLimits = {
                    starter: { max_sites: 10, max_crawls_per_month: 100 },
                    professional: { max_sites: 50, max_crawls_per_month: 500 },
                    enterprise: { max_sites: -1, max_crawls_per_month: -1 },
                };

                await base44.asServiceRole.entities.Organization.update(orgId, {
                    plan: plan,
                    stripe_subscription_id: session.subscription,
                    subscription_status: 'active',
                    ...planLimits[plan],
                });
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const orgs = await base44.asServiceRole.entities.Organization.filter({
                    stripe_subscription_id: subscription.id,
                });

                if (orgs[0]) {
                    await base44.asServiceRole.entities.Organization.update(orgs[0].id, {
                        subscription_status: subscription.status,
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const orgs = await base44.asServiceRole.entities.Organization.filter({
                    stripe_subscription_id: subscription.id,
                });

                if (orgs[0]) {
                    await base44.asServiceRole.entities.Organization.update(orgs[0].id, {
                        subscription_status: 'canceled',
                        plan: 'free',
                        max_sites: 3,
                        max_crawls_per_month: 30,
                    });
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const orgs = await base44.asServiceRole.entities.Organization.filter({
                    stripe_customer_id: invoice.customer,
                });

                if (orgs[0]) {
                    await base44.asServiceRole.entities.Organization.update(orgs[0].id, {
                        subscription_status: 'past_due',
                    });
                }
                break;
            }
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});