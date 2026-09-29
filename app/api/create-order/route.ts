import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const products: Record<string, number> = {
  VIP: 49,
  MVP: 99,
  "MVP+": 199,
  "1,000 Coins": 29,
  "5,000 Coins": 99,
  "10,000 Coins": 169,
  "Common Key": 19,
  "Rare Key": 49,
  "Legendary Key": 99,
  "Season Pass": 149,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = String(body.product || "").trim();
    const username = String(body.username || "").trim();

    if (!product || !username) {
      return NextResponse.json(
        { error: "Product and Minecraft username are required." },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
      return NextResponse.json(
        { error: "Invalid Minecraft username." },
        { status: 400 }
      );
    }

    const price = products[product];

    if (!price) {
      return NextResponse.json(
        { error: "Invalid product." },
        { status: 400 }
      );
    }

    const apiKey = process.env.FAMGATEWAY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://famgateway.in/api/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          amount: price,
          description: `MINE MC - ${product}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.order_id) {
      console.error("FamGateway error:", data);

      return NextResponse.json(
        { error: "Unable to create payment order." },
        { status: 502 }
      );
    }

    await prisma.order.create({
      data: {
        orderId: data.order_id,
        product,
        price,
        username,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: data.order_id,
      qrUrl: data.qr_url || null,
      checkoutUrl: data.checkout_url || null,
      upiIntent: data.upi_intent || null,
      amount: data.payable_amount ?? price,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
    }
