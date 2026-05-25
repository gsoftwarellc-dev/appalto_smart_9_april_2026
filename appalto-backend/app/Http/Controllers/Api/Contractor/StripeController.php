<?php

namespace App\Http\Controllers\Api\Contractor;

use App\Http\Controllers\Controller;
use App\Models\SystemConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeController extends Controller
{
    private function stripe(): StripeClient
    {
        return new StripeClient(config('services.stripe.secret'));
    }

    private function getCreditsPerEuro(): float
    {
        $config = SystemConfig::where('key', 'creditsPerEuro')->first();
        return $config ? (float) $config->value : 1.0;
    }

    public function createCheckoutSession(Request $request)
    {
        $request->validate([
            'credits' => 'required|integer|min:1|max:100000',
        ]);

        $credits = (int) $request->credits;
        $creditsPerEuro = $this->getCreditsPerEuro();
        $priceInEuros = $creditsPerEuro > 0 ? round($credits / $creditsPerEuro, 2) : $credits;
        $priceInCents = (int) round($priceInEuros * 100);

        $user = $request->user();
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5174'), '/');

        $session = $this->stripe()->checkout->sessions->create([
            'payment_method_types' => ['card', 'paypal'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'eur',
                    'unit_amount' => $priceInCents,
                    'product_data' => [
                        'name' => "{$credits} Appalto Smart Credits",
                        'description' => "Top up your account with {$credits} credits",
                    ],
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'customer_email' => $user->email,
            'metadata' => [
                'user_id' => $user->id,
                'credits' => $credits,
                'price_euros' => $priceInEuros,
            ],
            'success_url' => "{$frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}",
            'cancel_url' => "{$frontendUrl}/payment/cancel",
        ]);

        return response()->json(['url' => $session->url]);
    }

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        if ($webhookSecret) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        } else {
            $event = json_decode($payload, true);
            $event = (object) ['type' => $event['type'], 'data' => (object) ['object' => (object) $event['data']['object']]];
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $metadata = is_array($session->metadata) ? $session->metadata : (array) $session->metadata;

            $userId = $metadata['user_id'] ?? null;
            $credits = (int) ($metadata['credits'] ?? 0);
            $priceEuros = (float) ($metadata['price_euros'] ?? 0);

            if ($userId && $credits > 0) {
                DB::transaction(function () use ($userId, $credits, $priceEuros, $session) {
                    $user = \App\Models\User::find($userId);
                    if (!$user) return;

                    $credit = $user->credits ?: $user->credits()->create(['balance' => 0]);
                    $credit->increment('balance', $credits);

                    $user->transactions()->create([
                        'type' => 'purchase',
                        'amount' => $credits,
                        'cash_amount' => $priceEuros,
                        'description' => "Credit Purchase ({$credits} credits) via Stripe",
                        'status' => 'completed',
                        'stripe_session_id' => is_object($session) ? $session->id : ($session['id'] ?? null),
                    ]);
                });
            }
        }

        return response()->json(['status' => 'ok']);
    }

    public function verifySession(Request $request)
    {
        $request->validate(['session_id' => 'required|string']);

        $session = $this->stripe()->checkout->sessions->retrieve($request->session_id);

        if ($session->payment_status !== 'paid') {
            return response()->json(['paid' => false]);
        }

        $metadata = (array) $session->metadata;
        $userId = $metadata['user_id'] ?? null;
        $user = $request->user();

        if (!$userId || (int) $userId !== $user->id) {
            return response()->json(['paid' => false]);
        }

        $credit = $user->credits;

        return response()->json([
            'paid' => true,
            'credits' => (int) ($metadata['credits'] ?? 0),
            'balance' => $credit ? $credit->balance : 0,
        ]);
    }
}
