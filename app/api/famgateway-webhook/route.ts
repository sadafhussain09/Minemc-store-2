import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const PRODUCTS: Record<
  string,
  {
    price: number;
    command: (player: string) => string;
  }
> = {
  // ================================
  // PERMANENT RANKS
  // ================================

  god: {
    price: 300,
    command: (player) =>
      `lp user ${player} parent set god`,
  },

  legend: {
    price: 270,
    command: (player) =>
      `lp user ${player} parent set legend`,
  },

  hero: {
    price: 220,
    command: (player) =>
      `lp user ${player} parent set hero`,
  },

  pro: {
    price: 150,
    command: (player) =>
      `lp user ${player} parent set pro`,
  },

  // ================================
  // TIMED RANKS
  // ================================

  god_monthly: {
    price: 180,
    command: (player) =>
      `lp user ${player} parent addtemp god 30d`,
  },

  legend_monthly: {
    price: 150,
    command: (player) =>
      `lp user ${player} parent addtemp legend 30d`,
  },

  hero_monthly: {
    price: 70,
    command: (player) =>
      `lp user ${player} parent addtemp hero 30d`,
  },

  pro_monthly: {
    price: 40,
    command: (player) =>
      `lp user ${player} parent addtemp pro 30d`,
  },

  // ================================
  // COINS
  // ================================

  coins_1100: {
    price: 60,
    command: (player) =>
      `p give ${player} 1100`,
  },

  coins_2400: {
    price: 115,
    command: (player) =>
      `p give ${player} 2400`,
  },

  coins_5300: {
    price: 230,
    command: (player) =>
      `p give ${player} 5300`,
  },

  coins_12000: {
    price: 445,
    command: (player) =>
      `p give ${player} 12000`,
  },

  // ================================
  // CRATE KEYS
  // ================================

  insane_key_5x: {
    price: 180,
    command: (player) =>
      `crate key give ${player} insane 5`,
  },

  epic_key_5x: {
    price: 150,
    command: (player) =>
      `crate key give ${player} epic 5`,
  },

  rare_key_5x: {
    price: 120,
    command: (player) =>
      `crate key give ${player} rare 5`,
  },

  // ================================
  // SEASON PASS
  // ================================

  fly_season: {
    price: 270,
    command: (player) =>
      `lp user ${player} permission set essential.fly true`,
  },

  size_season: {
    price: 190,
    command: (player) =>
      `lp user ${player} permission set resizeplayers.scale.self true`,
  },
};


// ========================================
// VERIFY FAMGATEWAY WEBHOOK SIGNATURE
// ========================================

function verifySignature(
  rawBody: string,
  receivedSignature: string,
  apiKey: string
): boolean {
  const expectedSignature =
    crypto
      .createHmac("sha256", apiKey)
      .update(rawBody)
      .digest("hex");

  const receivedBuffer =
    Buffer.from(receivedSignature, "utf8");

  const expectedBuffer =
    Buffer.from(expectedSignature, "utf8");

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}


// ========================================
// VERIFY ORDER DIRECTLY WITH FAMGATEWAY
// ========================================

async function verifyFamGatewayOrder(
  orderId: string,
  apiKey: string
) {
  const url =
    "https://famgateway.in/api/verify-order.php" +
    "?order_id=" +
    encodeURIComponent(orderId);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Api-Key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `FamGateway verification failed: ${response.status}`
    );
  }

  return await response.json();
}


// ========================================
// SEND COMMAND TO PTERODACTYL
// ========================================

async function sendPterodactylCommand(
  command: string
) {
  const panelUrl =
    process.env.PTERO_PANEL_URL;

  const serverId =
    process.env.PTERO_SERVER_ID;

  const apiKey =
    process.env.PTERO_CLIENT_API_KEY;

  if (!panelUrl || !serverId || !apiKey) {
    throw new Error(
      "Pterodactyl environment variables are missing."
    );
  }

  const cleanPanelUrl =
    panelUrl.replace(/\/+$/, "");

  const url =
    `${cleanPanelUrl}/api/client/servers/${serverId}/command`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify({
      command,
    }),
  });

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Pterodactyl command failed: ${response.status} ${errorText}`
    );
  }

  return true;
}


// ========================================
// WEBHOOK
// ========================================

export async function POST(
  request: NextRequest
) {
  try {
    const apiKey =
      process.env.FAMGATEWAY_API_KEY;

    if (!apiKey) {
      console.error(
        "FAMGATEWAY_API_KEY is missing."
      );

      return NextResponse.json(
        {
          error:
            "Payment gateway is not configured.",
        },
        { status: 500 }
      );
    }


    // IMPORTANT:
    // Read RAW body before JSON parsing.
    const rawBody =
      await request.text();

    const signature =
      request.headers.get(
        "x-famgateway-signature"
      ) || "";


    // ====================================
    // HMAC VERIFICATION
    // ====================================

    if (
      !verifySignature(
        rawBody,
        signature,
        apiKey
      )
    ) {
      console.error(
        "Invalid FamGateway webhook signature."
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        { status: 401 }
      );
    }


    // ====================================
    // PARSE VERIFIED PAYLOAD
    // ====================================

    let payload: any;

    try {
      payload =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON payload.",
        },
        { status: 400 }
      );
    }


    const orderId =
      String(
        payload.order_id || ""
      ).trim();

    const webhookStatus =
      String(
        payload.status || ""
      ).toLowerCase();

    const webhookAmount =
      Number(
        payload.amount || 0
      );

    const utr =
      payload.utr
        ? String(payload.utr)
        : null;

    const transactionId =
      payload.transaction_id
        ? String(payload.transaction_id)
        : null;


    if (!orderId) {
      return NextResponse.json(
        {
          error:
            "Missing order_id.",
        },
        { status: 400 }
      );
    }


    // Webhook only fulfills successful payments.
    if (
      webhookStatus !==
      "success"
    ) {
      return NextResponse.json({
        status: "ignored",
      });
    }


    // ====================================
    // FIND OUR ORDER
    // ====================================

    const order =
      await prisma.order.findUnique({
        where: {
          orderId,
        },
      });


    if (!order) {
      console.error(
        "Order not found:",
        orderId
      );

      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        { status: 404 }
      );
    }


    // ====================================
    // ALREADY DELIVERED?
    // ====================================

    if (order.delivered) {
      return NextResponse.json({
        status: "already_delivered",
      });
    }


    // ====================================
    // CHECK PRODUCT
    // ====================================

    const product =
      PRODUCTS[order.product];

    if (!product) {
      console.error(
        "Invalid stored product:",
        order.product
      );

      return NextResponse.json(
        {
          error:
            "Invalid product.",
        },
        { status: 500 }
      );
    }


    // ====================================
    // CHECK EXPECTED PRICE
    // ====================================

    if (
      product.price !==
      order.price
    ) {
      console.error(
        "Database price mismatch:",
        orderId
      );

      return NextResponse.json(
        {
          error:
            "Order price mismatch.",
        },
        { status: 409 }
      );
    }


    // ====================================
    // CHECK WEBHOOK AMOUNT
    // ====================================

    if (
      webhookAmount !==
      order.price
    ) {
      console.error(
        "Payment amount mismatch:",
        {
          orderId,
          expected: order.price,
          received: webhookAmount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Payment amount mismatch.",
        },
        { status: 409 }
      );
    }


    // ====================================
    // AUTHORITATIVE SERVER CHECK
    // ====================================

    const verified =
      await verifyFamGatewayOrder(
        orderId,
        apiKey
      );


    const verifiedStatus =
      String(
        verified.status ||
        verified.data?.status ||
        ""
      ).toLowerCase();


    if (
      verifiedStatus !==
      "success"
    ) {
      console.error(
        "Authoritative payment verification failed:",
        verified
      );

      return NextResponse.json(
        {
          error:
            "Payment could not be independently verified.",
        },
        { status: 409 }
      );
    }


    const verifiedAmount =
      Number(
        verified.amount ??
        verified.data?.amount ??
        verified.payable_amount ??
        verified.data?.payable_amount ??
        0
      );


    if (
      verifiedAmount !==
      order.price
    ) {
      console.error(
        "Verified amount mismatch:",
        {
          orderId,
          expected: order.price,
          received: verifiedAmount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Verified payment amount mismatch.",
        },
        { status: 409 }
      );
    }


    // ====================================
    // CLAIM ORDER
    // ====================================
    //
    // This prevents two webhook requests
    // from processing the same pending order
    // simultaneously.

    const claim =
      await prisma.order.updateMany({
        where: {
          id: order.id,
          delivered: false,
          status: {
            in: [
              "pending",
              "success",
            ],
          },
        },

        data: {
          status: "processing",
          transactionId:
            transactionId,
          utr: utr,
        },
      });


    if (claim.count === 0) {
      return NextResponse.json({
        status:
          "already_processing",
      });
    }


    // ====================================
    // BUILD FIXED COMMAND
    // ====================================

    const command =
      product.command(
        order.username
      );


    console.log(
      `Delivering ${order.product} to ${order.username}`
    );

    console.log(
      `Pterodactyl command: ${command}`
    );


    // ====================================
    // SEND COMMAND
    // ====================================

    try {
      await sendPterodactylCommand(
        command
      );
    } catch (deliveryError) {

      console.error(
        "Pterodactyl delivery failed:",
        deliveryError
      );


      // Return order to pending so
      // FamGateway can retry the webhook.
      await prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          status: "pending",
        },
      });


      return NextResponse.json(
        {
          error:
            "Minecraft delivery failed. Webhook will be retried.",
        },
        { status: 500 }
      );
    }


    // ====================================
    // MARK DELIVERED
    // ====================================

    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: "delivered",
        delivered: true,
        transactionId:
          transactionId,
        utr: utr,
        deliveryMessage:
          `Delivered using command: ${command}`,
      },
    });


    console.log(
      `Successfully delivered ${order.product} to ${order.username}`
    );


    return NextResponse.json({
      status: "delivered",
      orderId,
    });

  } catch (error) {

    console.error(
      "FamGateway webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
