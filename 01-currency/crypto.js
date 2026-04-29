
const priceEl = document.getElementById('price-display');
const statusEl = document.getElementById('status');
const cardEl = document.getElementById('tracker');

let lastPrice = null;


function updateUI(price) {
    priceEl.innerText = `$${price.toLocaleString()}`;

    if (lastPrice !== null) {
        const isUp = price >= lastPrice;

        cardEl.classList.remove('up', 'down');
        cardEl.classList.add(isUp ? 'up' : 'down');
    }

    statusEl.innerText = `Last updated: ${new Date().toLocaleTimeString()}`;
}

function setLoading() {
    cardEl.classList.add('loading');
    statusEl.innerText = "Syncing...";
}

function setError() {
    cardEl.classList.remove('loading');
    statusEl.innerText = "API limit hit. Retrying soon...";
}


async function fetchPrice() {
    console.log("Fetching latest BTC price...");
    setLoading();

    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        const price = data.bitcoin.usd;

        updateUI(price);

        lastPrice = price;
        cardEl.classList.remove('loading');

    } catch (err) {
        console.error("Failed to pull crypto data:", err);
        setError();
    }
}


fetchPrice();

setInterval(fetchPrice, 10000);

