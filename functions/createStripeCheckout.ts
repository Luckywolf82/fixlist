import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan, organization_id } = await req.json();

        const org = (await base44.asServiceRole.entities.Organization.filter({ id: organization_id }))[0];
        if (!org) {
            return Response.json({ error: 'Organization not found' }, { status: 404 });
        }

        const priceMap = {
            starter: Deno.env.get('STRIPE_PRICE_STARTER'),
            professional: Deno.env.get('STRIPE_PRICE_PROFESSIONAL'),
            enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
        };

        const priceId = priceMap[plan];
        if (!priceId) {
            return Response.json({ error: 'Invalid plan' }, { status: 400 });
        }

        let customerId = org.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    organization_id: org.id,
                    organization_name: org.name,
                },
            });
            customerId = customer.id;
            await base44.asServiceRole.entities.Organization.update(org.id, {
                stripe_customer_id: customerId,
            });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${Deno.env.get('APP_URL')}/billing?success=true`,
            cancel_url: `${Deno.env.get('APP_URL')}/billing?canceled=true`,
            metadata: {
                organization_id: org.id,
                plan: plan,
            },
        });

        return Response.json({ url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});