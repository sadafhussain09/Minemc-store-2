// ================================
// MINE MC STORE
// ================================

const products = [
    // ================================
    // PERMANENT RANKS
    // ================================

    {
        id: "god",
        category: "Permanent Ranks",
        name: "God",
        price: 300,
        icon: "💎",
        description: "Unlock the powerful permanent God rank on MINE MC."
    },

    {
        id: "legend",
        category: "Permanent Ranks",
        name: "Legend",
        price: 270,
        icon: "💎",
        description: "Unlock the permanent Legend rank on MINE MC."
    },

    {
        id: "hero",
        category: "Permanent Ranks",
        name: "Hero",
        price: 220,
        icon: "💎",
        description: "Unlock the permanent Hero rank on MINE MC."
    },

    {
        id: "pro",
        category: "Permanent Ranks",
        name: "Pro",
        price: 150,
        icon: "💎",
        description: "Unlock the permanent Pro rank on MINE MC."
    },

    // ================================
    // TIMED RANKS
    // ================================

    {
        id: "god_monthly",
        category: "Timed Ranks",
        name: "God [Monthly]",
        price: 180,
        icon: "💎",
        description: "Get the God rank for 30 days."
    },

    {
        id: "legend_monthly",
        category: "Timed Ranks",
        name: "Legend [Monthly]",
        price: 150,
        icon: "💎",
        description: "Get the Legend rank for 30 days."
    },

    {
        id: "hero_monthly",
        category: "Timed Ranks",
        name: "Hero [Monthly]",
        price: 70,
        icon: "💎",
        description: "Get the Hero rank for 30 days."
    },

    {
        id: "pro_monthly",
        category: "Timed Ranks",
        name: "Pro [Monthly]",
        price: 40,
        icon: "💎",
        description: "Get the Pro rank for 30 days."
    },

    // ================================
    // COINS
    // ================================

    {
        id: "coins_1100",
        category: "Coins",
        name: "1,100 Coins",
        price: 60,
        icon: "🪙",
        description: "Add 1,100 coins to your Minecraft account."
    },

    {
        id: "coins_2400",
        category: "Coins",
        name: "2,400 Coins",
        price: 115,
        icon: "🪙",
        description: "Add 2,400 coins to your Minecraft account."
    },

    {
        id: "coins_5300",
        category: "Coins",
        name: "5,300 Coins",
        price: 230,
        icon: "🪙",
        description: "Add 5,300 coins to your Minecraft account."
    },

    {
        id: "coins_12000",
        category: "Coins",
        name: "12,000 Coins",
        price: 445,
        icon: "🪙",
        description: "Add 12,000 coins to your Minecraft account."
    },

    // ================================
    // CRATE KEYS
    // ================================

    {
        id: "insane_key_5x",
        category: "Crate Keys",
        name: "Insane Key [5x]",
        price: 180,
        icon: "📦",
        description: "Get 5 Insane Crate Keys."
    },

    {
        id: "epic_key_5x",
        category: "Crate Keys",
        name: "Epic Key [5x]",
        price: 150,
        icon: "📦",
        description: "Get 5 Epic Crate Keys."
    },

    {
        id: "rare_key_5x",
        category: "Crate Keys",
        name: "Rare Key [5x]",
        price: 120,
        icon: "📦",
        description: "Get 5 Rare Crate Keys."
    },

    // ================================
    // SEASON PASS
    // ================================

    {
        id: "fly_season",
        category: "Season Pass",
        name: "Fly [Season]",
        price: 270,
        icon: "🕊️",
        description: "Unlock /fly for the current season."
    },

    {
        id: "size_season",
        category: "Season Pass",
        name: "Size [Season]",
        price: 190,
        icon: "📏",
        description: "Unlock /size for the current season."
    }
];


// ================================
// CREATE PRODUCT CARD
// ================================

function createProductCard(product) {
    return `
        <div class="product-card">

            <div class="product-icon">
                ${product.icon}
            </div>

            <div class="product-category">
                ${product.category}
            </div>

            <h3>
                ${product.name}
            </h3>

            <p>
                ${product.description}
            </p>

            <div class="product-bottom">

                <div class="product-price">
                    ₹${product.price}
                </div>

                <button
                    class="buy-btn"
                    onclick="buyProduct('${product.id}')"
                >
                    BUY NOW
                </button>

            </div>

        </div>
    `;
}


// ================================
// LOAD PRODUCTS
// ================================

function loadProducts() {
    const container = document.getElementById("products");

    if (!container) {
        console.error(
            "MINE MC: #products element not found."
        );

        return;
    }

    container.innerHTML = products
        .map(createProductCard)
        .join("");
}


// ================================
// BUY PRODUCT
// ================================

function buyProduct(productId) {
    const product = products.find(
        item => item.id === productId
    );

    if (!product) {
        console.error(
            "MINE MC: Product not found:",
            productId
        );

        return;
    }

    const paymentPage =
        "payment.html?product=" +
        encodeURIComponent(product.id) +
        "&name=" +
        encodeURIComponent(product.name) +
        "&price=" +
        encodeURIComponent(product.price);

    window.location.href = paymentPage;
}


// ================================
// START STORE
// ================================

document.addEventListener(
    "DOMContentLoaded",
    loadProducts
);
