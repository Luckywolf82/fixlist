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

        const { organization_id } = await req.json();

        const org = (await base44.asServiceRole.entities.Organization.filter({ id: organization_id }))[0];
        if (!org || !org.stripe_customer_id) {
            return Response.json({ error: 'No billing information found' }, { status: 404 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: org.stripe_customer_id,
            return_url: `${Deno.env.get('APP_URL')}/billing`,
        });

        return Response.json({ url: session.url });
    } catch (error) {
        console.error('Billing portal error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});