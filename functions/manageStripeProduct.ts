import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.custom_role !== 'superadmin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, productData, productId } = await req.json();

    if (action === 'create') {
      // Create product in Stripe
      const stripeProduct = await stripe.products.create({
        name: productData.name,
        active: productData.active !== undefined ? productData.active : true,
      });

      // Create price in Stripe
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(productData.price * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });

      // Create in Base44 database
      const product = await base44.asServiceRole.entities.Product.create({
        ...productData,
        stripe_price_id: stripePrice.id,
        stripe_product_id: stripeProduct.id,
      });

      return Response.json({ success: true, product });
    }

    if (action === 'update') {
      // Get existing product
      const products = await base44.asServiceRole.entities.Product.filter({ id: productId });
      const existingProduct = products[0];

      if (!existingProduct) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }

      // Update Stripe product
      if (existingProduct.stripe_product_id) {
        await stripe.products.update(existingProduct.stripe_product_id, {
          name: productData.name,
          active: productData.active !== undefined ? productData.active : true,
        });
      }

      // If price changed, create new price and archive old one
      if (productData.price !== existingProduct.price) {
        if (existingProduct.stripe_price_id) {
          await stripe.prices.update(existingProduct.stripe_price_id, {
            active: false,
          });
        }

        const newPrice = await stripe.prices.create({
          product: existingProduct.stripe_product_id,
          unit_amount: Math.round(productData.price * 100),
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
        });

        productData.stripe_price_id = newPrice.id;
      }

      // Update in Base44 database
      const updated = await base44.asServiceRole.entities.Product.update(productId, productData);

      return Response.json({ success: true, product: updated });
    }

    if (action === 'delete') {
      // Get existing product
      const products = await base44.asServiceRole.entities.Product.filter({ id: productId });
      const existingProduct = products[0];

      if (!existingProduct) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }

      // Archive in Stripe (can't delete products that have been used)
      if (existingProduct.stripe_product_id) {
        await stripe.products.update(existingProduct.stripe_product_id, {
          active: false,
        });
      }

      // Delete from Base44 database
      await base44.asServiceRole.entities.Product.delete(productId);

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Stripe product management error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});