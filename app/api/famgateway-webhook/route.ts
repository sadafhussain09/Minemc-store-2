import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const PRODUCTS: Record<
  string,
  {
    price: number;
    commands: (player: string) => string[];
  }
> = {
  // ================================
  // PERMANENT RANKS
  // ================================

  god: {
    price: 300,
    commands: (player) => [
      `lp user ${player} parent set god`,
    ],
  },

  legend: {
    price: 270,
    commands: (player) => [
      `lp user ${player} parent set legend`,
    ],
  },

  hero: {
    price: 220,
    commands: (player) => [
      `lp user ${player} parent set hero`,
    ],
  },

  pro: {
    price: 150,
    commands: (player) => [
      `lp user ${player} parent set pro`,
    ],
  },

  // ================================
  // MONTHLY RANKS
  // ================================

  god_monthly: {
    price: 180,
    commands: (player) => [
      `lp user ${player} parent addtemp god 30d`,
    ],
  },

  legend_monthly: {
    price: 150,
    commands: (player) => [
      `lp user ${player} parent addtemp legend 30d`,
    ],
  },

  hero_monthly: {
    price: 70,
    commands: (player) => [
      `lp user ${player} parent addtemp hero 30d`,
    ],
  },

  pro_monthly: {
    price: 40,
    commands: (player) => [
      `lp user ${player} parent addtemp pro 30d`,
    ],
  },

  // ================================
  // COINS
  // ================================

  coins_1100: {
    price: 60,
    commands: (player) => [
      `p give ${player} 1100`,
    ],
  },

  coins_2400: {
    price: 115,
    commands: (player) => [
      `p give ${player} 2400`,
    ],
  },

  coins_5300: {
    price: 230,
    commands: (player) => [
      `p give ${player} 5300`,
    ],
  },

  coins_12000: {
    price: 445,
    commands: (player) => [
      `p give ${player} 12000`,
    ],
  },

  // ================================
  // CRATE KEYS
  // ================================

  insane_key_5x: {
    price: 180,
    commands: (player) => [
      `crate key give ${player} insane 5`,
    ],
  },

  epic_key_5x: {
    price: 150,
    commands: (player) => [
      `crate key give ${player} epic 5`,
    ],
  },

  rare_key_5x: {
    price: 120,
    commands: (player) => [
      `crate key give ${player} rare 5`,
    ],
  },

  // ================================
  // SEASON - FLY
  // ================================

  fly_season: {
    price: 270,
    commands: (player) => [
      `lp user ${player} permission set essential.fly true`,
    ],
  },

  // ================================
  // SEASON - RESIZE
  // ================================

  size_season: {
    price: 190,
    commands: (player) => [
      `lp user ${player} permission set resizeplayers.scale.self true`,
    ],
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
  if (!receivedSignature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", apiKey)
    .update(rawBody)
    .digest("hex");

  const receivedBuffer = Buffer.from(
    receivedSignature.trim(),
    "utf8"
  );

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

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
    "?api_key=" +
    encodeURIComponent(apiKey) +
    "&order_id=" +
    encodeURIComponent(orderId);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `FamGateway verification failed: ${response.status} ${JSON.stringify(
        result
      )}`
    );
  }

  return result;
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
    // ====================================
    // ENVIRONMENT
    // ====================================

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


    // ====================================
    // READ RAW WEBHOOK BODY
    // ====================================

    const rawBody =
      await request.text();

    const signature =
      request.headers.get(
        "x-famgateway-signature"
      ) || "";


    // ====================================
    // VERIFY SIGNATURE
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
    // PARSE PAYLOAD
    // ====================================

    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON payload.",
        },
        { status: 400 }
      );
    }


    // ====================================
    // READ PAYMENT DATA
    // ====================================

    const orderId =
      String(
        payload.order_id || ""
      ).trim();

    const webhookStatus =
      String(
        payload.status || ""
      ).toLowerCase()
      .trim();

    const webhookAmount =
      Number(
        payload.amount ??
        payload.payable_amount ??
        0
      );

    const transactionId =
      payload.transaction_id
        ? String(
            payload.transaction_id
          )
        : null;

    const utr =
      payload.utr
        ? String(payload.utr)
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


    // ====================================
    // ONLY PROCESS SUCCESS PAYMENTS
    // ====================================

    if (
      webhookStatus !==
      "success"
    ) {
      return NextResponse.json({
        status: "ignored",
      });
    }


    // ====================================
    // FIND ORDER
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
    // ALREADY DELIVERED
    // ====================================

    if (order.delivered) {
      return NextResponse.json({
        status:
          "already_delivered",
        orderId,
      });
    }


    // ====================================
    // FIND PRODUCT
    // ====================================

    const product =
      PRODUCTS[order.product];

    if (!product) {
      console.error(
        "Unknown product:",
        order.product
      );

      return NextResponse.json(
        {
          error:
            "Unknown product.",
        },
        { status: 500 }
      );
    }


    // ====================================
    // CHECK DATABASE PRICE
    // ====================================

    if (
      product.price !==
      order.price
    ) {
      console.error(
        "Database price mismatch:",
        {
          orderId,
          product: order.product,
          expected: product.price,
          stored: order.price,
        }
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
        "Webhook amount mismatch:",
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
    // AUTHORITATIVE FAMGATEWAY CHECK
    // ====================================

    const verified =
      await verifyFamGatewayOrder(
        orderId,
        apiKey
      );

    const verifiedStatus =
      String(
        verified.status ??
        verified.data?.status ??
        ""
      )
        .toLowerCase()
        .trim();


    if (
      verifiedStatus !==
      "success"
    ) {
      console.error(
        "FamGateway verification failed:",
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


    // ====================================
    // CHECK VERIFIED AMOUNT
    // ====================================

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
          transactionId,
          utr,
        },
      });


    if (claim.count === 0) {
      return NextResponse.json({
        status:
          "already_processing",
        orderId,
      });
    }


    // ====================================
    // CREATE COMMANDS
    // ====================================

    const commands =
      product.commands(
        order.username
      );


    console.log(
      "MINE MC DELIVERY",
      {
        orderId,
        product: order.product,
        username: order.username,
        commands,
      }
    );


    // ====================================
    // SEND ALL COMMANDS
    // ====================================

    try {
      for (
        const command of commands
      ) {
        await sendPterodactylCommand(
          command
        );
      }
    } catch (deliveryError) {
      console.error(
        "Pterodactyl delivery failed:",
        deliveryError
      );

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
            "Minecraft delivery failed.",
        },
        { status: 500 }
      );
    }


    // ====================================
    // MARK AS DELIVERED
    // ====================================

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "delivered",
        delivered: true,
        transactionId,
        utr,
        deliveryMessage:
          `Delivered ${order.product} to ${order.username}.`,
      },
    });


    console.log(
      "MINE MC DELIVERY SUCCESS",
      {
        orderId,
        product: order.product,
        username: order.username,
      }
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
