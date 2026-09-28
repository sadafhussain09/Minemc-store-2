// MINE MC STORE PRODUCTS

const products = [
    {
        category: "Ranks",
        name: "VIP",
        price: 49,
        icon: "👑",
        description: "Unlock VIP perks on MINE MC",
        command: "/lp user {player} parent set vip"
    },
    {
        category: "Ranks",
        name: "MVP",
        price: 99,
        icon: "💎",
        description: "Premium MVP rank with exclusive perks",
        command: "/lp user {player} parent set mvp"
    },
    {
        category: "Ranks",
        name: "MVP+",
        price: 199,
        icon: "🔥",
        description: "Ultimate premium rank",
        command: "/lp user {player} parent set mvpplus"
    },

    {
        category: "Coins",
        name: "1,000 Coins",
        price: 29,
        icon: "🪙",
        description: "Add 1,000 coins to your account",
        command: "/eco give {player} 1000"
    },
    {
        category: "Coins",
        name: "5,000 Coins",
        price: 99,
        icon: "💰",
        description: "Add 5,000 coins to your account",
        command: "/eco give {player} 5000"
    },
    {
        category: "Coins",
        name: "10,000 Coins",
        price: 169,
        icon: "💰",
        description: "Add 10,000 coins to your account",
        command: "/eco give {player} 10000"
    },

    {
        category: "Crate Keys",
        name: "Common Key",
        price: 19,
        icon: "🔑",
        description: "Open a Common Crate",
        command: "/crate key give {player} common 1"
    },
    {
        category: "Crate Keys",
        name: "Rare Key",
        price: 49,
        icon: "🗝️",
        description: "Open a Rare Crate",
        command: "/crate key give {player} rare 1"
    },
    {
        category: "Crate Keys",
        name: "Legendary Key",
        price: 99,
        icon: "🔥",
        description: "Open a Legendary Crate",
        command: "/crate key give {player} legendary 1"
    },

    {
        category: "Season Pass",
        name: "Season Pass",
        price: 149,
        icon: "🏆",
        description: "Unlock exclusive Season rewards",
        command: "/seasonpass give {player}"
    }
];

function createProductCard(product) {
    return `
        <div class="product-card">

            <div class="product-icon">
                ${product.icon}
            </div>

            <div class="product-category">
                ${product.category}
            </div>

            <h3>${product.name}</h3>

            <p>${product.description}</p>

            <div class="product-bottom">

                <div class="product-price">
                    ₹${product.price}
                </div>

                <button
                    class="buy-btn"
                    onclick="buyProduct('${product.name}', ${product.price})">
                    BUY NOW
                </button>

            </div>

        </div>
    `;
}

function loadProducts() {

    const container = document.querySelector("#products");

    if (!container) return;

    container.innerHTML = products
        .map(product => createProductCard(product))
        .join("");
}

function buyProduct(name, price) {

    const url =
        "payment.html?product=" +
        encodeURIComponent(name) +
        "&price=" +
        encodeURIComponent(price);
    window.location.href = url;
}    

document.addEventListener("DOMContentLoaded", loadProducts);
