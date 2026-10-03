// supabase/functions/sync-clerk-user/index.js
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { Webhook } from 'https://esm.sh/svix@1.15.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET');
    if (!WEBHOOK_SECRET) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET');
    }

    const svix_id = req.headers.get('svix-id');
    const svix_timestamp = req.headers.get('svix-timestamp');
    const svix_signature = req.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Missing svix headers', { status: 400 });
    }

    const body = await req.text();
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } }
    );

    const { type, data } = evt;

    console.log(`Received webhook: ${type}`);

    if (type === 'user.created') {
      const { id, username, first_name, last_name, image_url, email_addresses } = data;

      const displayName =
        `${first_name ?? ''} ${last_name ?? ''}`.trim() ||
        username ||
        email_addresses?.[0]?.email_address?.split('@')[0] ||
        'Player';

      const friendCode = `SUPER7-${id.slice(-4).toUpperCase()}`;

      const { error: userError } = await supabase.from('users').upsert(
        {
          id,
          username: username ?? null,
          display_name: displayName,
          avatar_url: image_url ?? null,
          friend_code: friendCode,
        },
        { onConflict: 'id' }
      );

      if (userError) {
        console.error('User insert error:', userError);
        throw userError;
      }

      const { error: walletError } = await supabase.from('wallets').upsert(
        {
          user_id: id,
          balance: 1000,
        },
        { onConflict: 'user_id' }
      );

      if (walletError) {
        console.error('Wallet insert error:', walletError);
        throw walletError;
      }

      await supabase.from('transactions').insert({
        user_id: id,
        amount: 1000,
        type: 'bonus',
        label: 'Welcome bonus',
      });

      console.log(`Created user ${id} with wallet and bonus`);
    }

    if (type === 'user.updated') {
      const { id, username, first_name, last_name, image_url } = data;

      const displayName =
        `${first_name ?? ''} ${last_name ?? ''}`.trim() || username || 'Player';

      const { error } = await supabase
        .from('users')
        .update({
          username: username ?? null,
          display_name: displayName,
          avatar_url: image_url ?? null,
        })
        .eq('id', id);

      if (error) {
        console.error('User update error:', error);
        throw error;
      }

      console.log(`Updated user ${id}`);
    }

    if (type === 'user.deleted') {
      const { id } = data;
      await supabase.from('users').delete().eq('id', id);
      console.log(`Deleted user ${id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});