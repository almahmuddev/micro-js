


const state = {
    search: '',
    category: 'all',
    sort: 'default'
};


const products = [
    { id: 1, name: 'Ceramic Mug', price: 28, category: 'home' },
    { id: 2, name: 'Linen Tote', price: 45, category: 'fashion' },
    { id: 3, name: 'Candle', price: 32, category: 'home' },
    { id: 4, name: 'Notebook', price: 22, category: 'home' },
    { id: 5, name: 'Sneakers', price: 90, category: 'fashion' },
    { id: 6, name: 'Jacket', price: 120, category: 'fashion' }
];


function getFilteredProducts() {
    let result = [...products];

    // search
    if (state.search) {
        result = result.filter(p =>
            p.name.toLowerCase().includes(state.search.toLowerCase())
        );
    }

    // category
    if (state.category !== 'all') {
        result = result.filter(p => p.category === state.category);
    }

    // sort
    if (state.sort === 'low') {
        result.sort((a, b) => a.price - b.price);
    } else if (state.sort === 'high') {
        result.sort((a, b) => b.price - a.price);
    }

    return result;
}

function renderProducts(list) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    if (list.length === 0) {
        grid.innerHTML = `<p class="text-gray-500">No products found</p>`;
        return;
    }

    list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded shadow hover:shadow-md transition';

        card.innerHTML = `
      <h3 class="font-semibold">${p.name}</h3>
      <p class="text-sm text-gray-500">${p.category}</p>
      <p class="mt-2 font-bold">$${p.price}</p>
    `;

        grid.appendChild(card);
    });
}

function debounce(fn, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

function update() {
    const filtered = getFilteredProducts();
    renderProducts(filtered);
}

// Debounced search
const handleSearch = debounce((value) => {
    state.search = value.trim();
    update();
}, 300);

document.getElementById('search').addEventListener('input', (e) => {
    handleSearch(e.target.value);
});

// Category filter
document.getElementById('category').addEventListener('change', (e) => {
    state.category = e.target.value;
    update();
});

// Sorting
document.getElementById('sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    update();
});

update();



