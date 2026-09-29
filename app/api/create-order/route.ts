import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const products: Record<string, { name: string; price: number }> = {
  god: {
    name: "God",
    price: 300,
  },
  legend: {
    name: "Legend",
    price: 270,
  },
  hero: {
    name: "Hero",
    price: 220,
  },
  pro: {
    name: "Pro",
    price: 150,
  },

  god_monthly: {
    name: "God [Monthly]",
    price: 180,
  },
  legend_monthly: {
    name: "Legend [Monthly]",
    price: 150,
  },
  hero_monthly: {
    name: "Hero [Monthly]",
    price: 70,
  },
  pro_monthly: {
    name: "Pro [Monthly]",
    price: 40,
  },

  coins_1100: {
    name: "1,100 Coins",
    price: 60,
  },
  coins_2400: {
    name: "2,400 Coins",
    price: 115,
  },
  coins_5300: {
    name: "5,300 Coins",
    price: 230,
  },
  coins_12000: {
    name: "12,000 Coins",
    price: 445,
  },

  insane_key_5x: {
    name: "Insane Key [5x]",
    price: 180,
  },
  epic_key_5x: {
    name: "Epic Key [5x]",
    price: 150,
  },
  rare_key_5x: {
    name: "Rare Key [5x]",
    price: 120,
  },

  fly_season: {
    name: "Fly [Season]",
    price: 270,
  },
  size_season: {
    name: "Size [Season]",
    price: 190,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const productId = String(body.productId || "").trim();
    const username = String(body.username || "").trim();

    if (!productId || !username) {
      return NextResponse.json(
        {
          error: "Product and Minecraft username are required.",
        },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      return NextResponse.json(
        {
          error: "Invalid Minecraft username.",
        },
        { status: 400 }
      );
    }

    const product = products[productId];

    if (!product) {
      return NextResponse.json(
        {
          error: "Invalid product.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.FAMGATEWAY_API_KEY;

    if (!apiKey) {
      console.error("FAMGATEWAY_API_KEY is missing.");

      return NextResponse.json(
        {
          error: "Payment gateway is not configured.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://famgateway.in/api/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          amount: product.price,
          customer_name: username,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.status !== "success" || !result.data) {
      console.error("FamGateway create-order error:", result);

      return NextResponse.json(
        {
          error:
            result.message ||
            "Unable to create payment order.",
        },
        { status: 502 }
      );
    }

    const order = result.data;

    await prisma.order.create({
      data: {
        orderId: order.order_id,
        product: productId,
        price: product.price,
        username,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.order_id,
      product: product.name,
      amount: Number(order.payable_amount || product.price),
      qrUrl: order.qr_url || null,
      checkoutUrl: order.checkout_url || null,
      upiIntent: order.upi_intent || null,
      expiresAt: order.expires_at_ist || null,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}
