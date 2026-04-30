
const state = {
  searchQuery: '',
  activeCategory: 'all',
  activeSort: 'default'
};

// 2. data
const products = [
  { id: 1, name: 'Ceramic Mug', price: 28, category: 'home' },
  { id: 2, name: 'Linen Tote', price: 45, category: 'fashion' },
  { id: 3, name: 'Candle', price: 32, category: 'home' },
  { id: 4, name: 'Notebook', price: 22, category: 'home' },
  { id: 5, name: 'Sneakers', price: 90, category: 'fashion' },
  { id: 6, name: 'Jacket', price: 120, category: 'fashion' }
];

function getFilteredList() {
  let list = [...products];

  // Filter by search text
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    list = list.filter(item => item.name.toLowerCase().includes(query));
  }

  // Filter by category
  if (state.activeCategory !== 'all') {
    list = list.filter(item => item.category === state.activeCategory);
  }

  // Handle sorting
  if (state.activeSort === 'low') {
    list.sort((a, b) => a.price - b.price);
  } else if (state.activeSort === 'high') {
    list.sort((a, b) => b.price - a.price);
  }

  return list;
}

// 4. UI Rendering
function render() {
  const grid = document.getElementById('grid');
  const filteredData = getFilteredList();

  if (filteredData.length === 0) {
    grid.innerHTML = `<p class="text-gray-400 italic py-10 col-span-full text-center">No products found...</p>`;
    return;
  }

  // Map data to HTML
  grid.innerHTML = filteredData.map(product => `
    <div class="bg-white p-5 rounded-lg border border-transparent shadow-sm hover:border-gray-900 hover:shadow-md transition-all duration-300">
      <h3 class="font-bold text-gray-800">${product.name}</h3>
      <p class="text-xs uppercase tracking-widest text-gray-400 mb-4">${product.category}</p>
      <p class="text-lg font-mono font-semibold text-gray-900">$${product.price}</p>
    </div>
  `).join('');
}

// 5. Utilities
function debounce(callback, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), wait);
  };
}

// 6. Interaction Handlers
const onSearchInput = debounce((value) => {
  state.searchQuery = value.trim();
  render();
});

document.getElementById('search').addEventListener('input', (e) => onSearchInput(e.target.value));

document.getElementById('category').addEventListener('change', (e) => {
  state.activeCategory = e.target.value;
  render();
});

document.getElementById('sort').addEventListener('change', (e) => {
  state.activeSort = e.target.value;
  render();
});

// Initial boot
render();