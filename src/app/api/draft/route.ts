import { draftMode } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import axios from "axios";
import Stripe from "stripe";

export async function GET() {
	draftMode().enable();
	redirect("/", RedirectType.replace);
}

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
	apiVersion: "2022-11-15", // Use the latest Stripe API version
});

interface CreatePaymentLinkRequest extends NextApiRequest {
	body: { amount: number };
}

async function parseBody(req: NextApiRequest): Promise<any> {
	const chunks: Uint8Array[] = [];
	for await (const chunk of req.body as AsyncIterable<Uint8Array>) {
		chunks.push(chunk);
	}

	const rawBody = Buffer.concat(chunks).toString("utf-8");
	return JSON.parse(rawBody); // Parse the raw body as JSON
}

function convertCurrencyToUpper(currencyCode) {
	if (typeof currencyCode !== "string") {
		throw new Error("Input must be a string");
	}
	return currencyCode.toUpperCase();
}

export async function POST(req: NextApiRequest) {
	if (req.method === "POST") {
		try {
			const body = await parseBody(req);
			const { products, currency, totalprice } = body;
			const exchangeRateResponse = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
			const exchangeRates = exchangeRateResponse.data.rates;

			let convoert_currency = convertCurrencyToUpper(currency);

			if (!exchangeRates[convoert_currency]) {
				return NextResponse.json({ error: "Unsupported target currency" });
			}

			const convertedAmount = Math.round(totalprice * exchangeRates[convoert_currency]);
			if (products.length <= 0) {
				return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
			}

			const line_items = products.map((item) => ({
				price_data: {
					currency: convoert_currency,
					product_data: {
						name: item.name,
						images: [item.image], // Add product image URL
					},
					unit_amount: item.price * 100 * exchangeRates[convoert_currency], // Price in cents
				},
				quantity: item.quantity,
				adjustable_quantity: {
					enabled: true, // Enable quantity adjustment on Stripe Checkout page
					minimum: 1,
					maximum: 100, // You can set a max limit for quantity
				},
			}));
			const session = await stripe.checkout.sessions.create({
				line_items,
				mode: "payment", // Use 'payment' for one-time payments
				success_url: process.env.NEXT_PUBLIC_STOREFRONT_URL + "/default-channel/products", // Redirects on success
				cancel_url: process.env.NEXT_PUBLIC_STOREFRONT_URL + "/default-channel/cart", // Redirects on cancel
				//cancel_url: redirect("/", RedirectType.replace),
			});
			return NextResponse.json({ link: session.url }, { status: 200 });
		} catch (error) {
			return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
			console.error("Error creating payment link:", error);
		}
	} else {
		// Handle unsupported HTTP methods
	}
}
