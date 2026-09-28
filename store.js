// ================================
// MINE MC STORE
// ================================

const products = [
    {
        category: "Ranks",
        name: "VIP",
        price: 49,
        icon: "👑",
        description: "Unlock VIP perks on MINE MC."
    },

    {
        category: "Ranks",
        name: "MVP",
        price: 99,
        icon: "💎",
        description: "Premium MVP rank with exclusive perks."
    },

    {
        category: "Ranks",
        name: "MVP+",
        price: 199,
        icon: "🔥",
        description: "Ultimate premium rank for MINE MC."
    },

    {
        category: "Coins",
        name: "1,000 Coins",
        price: 29,
        icon: "🪙",
        description: "Add 1,000 coins to your Minecraft account."
    },

    {
        category: "Coins",
        name: "5,000 Coins",
        price: 99,
        icon: "💰",
        description: "Add 5,000 coins to your Minecraft account."
    },

    {
        category: "Coins",
        name: "10,000 Coins",
        price: 169,
        icon: "💰",
        description: "Add 10,000 coins to your Minecraft account."
    },

    {
        category: "Crate Keys",
        name: "Common Key",
        price: 19,
        icon: "🔑",
        description: "Open a Common Crate."
    },

    {
        category: "Crate Keys",
        name: "Rare Key",
        price: 49,
        icon: "🗝️",
        description: "Open a Rare Crate."
    },

    {
        category: "Crate Keys",
        name: "Legendary Key",
        price: 99,
        icon: "🔥",
        description: "Open a Legendary Crate."
    },

    {
        category: "Season Pass",
        name: "Season Pass",
        price: 149,
        icon: "🏆",
        description: "Unlock exclusive seasonal rewards."
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
                    onclick="buyProduct('${product.name}', ${product.price})"
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

    const container =
        document.getElementById("products");

    if (!container) {
        console.error(
            "MINE MC: #products element not found."
        );

        return;
    }

    container.innerHTML =
        products
            .map(createProductCard)
            .join("");

}


// ================================
// BUY PRODUCT
// ================================

function buyProduct(name, price) {

    const paymentPage =
        "payment.html?product=" +
        encodeURIComponent(name) +
        "&price=" +
        encodeURIComponent(price);

    window.location.href = paymentPage;
}


// ================================
// START STORE
// ================================

document.addEventListener(
    "DOMContentLoaded",
    loadProducts
);
