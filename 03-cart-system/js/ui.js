// 

import { inventory, freeShippingLimit, standardShippingFee } from './data.js';
import { getCart, getSavedItems, findCartItem } from './cart.js';
import { filterProducts, setSearchTerm, setPriceRange, getCurrentFilters } from './filter.js';
import { calculateDiscount, shouldFreeShipping } from './coupon.js';

// cached DOM refs
let productsGrid, cartItems, cartBadge, cartEmpty, cartSummary;
let subtotalEl, shippingEl, discountEl, totalEl;
let savedSection, savedList;
let shippingFill, shippingMessage;
let toast, toastTimer;

export function initUI() {
  productsGrid  = document.getElementById('products-grid');
  cartItems     = document.getElementById('cart-items');
  cartBadge     = document.getElementById('cart-badge');
  cartEmpty     = document.getElementById('cart-empty');
  cartSummary   = document.getElementById('cart-summary');
  subtotalEl    = document.getElementById('subtotal');
  shippingEl    = document.getElementById('shipping');
  discountEl    = document.getElementById('discount');
  totalEl       = document.getElementById('total');
  savedSection  = document.getElementById('saved-section');
  savedList     = document.getElementById('saved-items-list');
  shippingFill  = document.getElementById('shipping-fill');
  shippingMessage = document.getElementById('shipping-message');
  toast         = document.getElementById('toast');

  // theme toggle — persists across sessions
  const themeToggle = document.getElementById('theme-toggle');
  const theme = localStorage.getItem('cart_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cart_theme', next);
  });
}

export function showToast(message, duration = 2000, isUndo = false, itemId = null) {
  if (toastTimer) clearTimeout(toastTimer);

  if (isUndo && itemId) {
    const undoBtn = document.createElement('button');
    undoBtn.textContent = ' Undo';
    undoBtn.style.cssText = 'margin-left:10px; background:white; color:#2d5a3d; border:none; border-radius:20px; padding:2px 8px; cursor:pointer;';
    undoBtn.onclick = () => {
      import('./cart.js').then(m => {
        m.undoLastRemoval(itemId);
        toast.style.opacity = '0';
      });
    };
    toast.innerHTML = '';
    toast.appendChild(document.createTextNode(message));
    toast.appendChild(undoBtn);
  } else {
    toast.innerHTML = message;
  }

  toast.style.opacity = '1';
  toastTimer = setTimeout(() => toast.style.opacity = '0', duration);
}

export function renderProducts() {
  const filtered = filterProducts();
  productsGrid.innerHTML = '';

  // update the results count + clear button
  const resultsCount = document.getElementById('results-count');
  const clearBtn     = document.getElementById('clear-filters-btn');
  const { search, priceRange } = getCurrentFilters();
  const isFiltered = search !== '' || priceRange !== 'all';

  if (resultsCount) {
    resultsCount.textContent = isFiltered
      ? `${filtered.length} of ${inventory.length} products`
      : `${inventory.length} products`;
  }
  if (clearBtn) {
    clearBtn.style.display = isFiltered ? 'inline-flex' : 'none';
  }

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'no-results';
    empty.textContent = 'No products match your search.';
    productsGrid.appendChild(empty);
    return;
  }

  filtered.forEach(product => {
    const cartItem = findCartItem(product.id);
    const qtyInCart = cartItem ? cartItem.qty : 0;
    const stockLeft = product.stock - qtyInCart;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img" style="background:${product.bg}">${product.emoji}</div>
      <div class="product-body">
        <div class="product-name">${product.name}</div>
        <div class="product-sub">${product.sub}</div>
        <div class="product-stock" style="font-size:0.7rem; color:${stockLeft < 3 ? '#a33028' : '#9a9485'}">
          ${stockLeft > 0 ? `${stockLeft} left` : 'Out of stock'}
        </div>
        <div class="product-footer">
          <span class="price">$${product.price.toFixed(2)}</span>
          <button class="add-btn ${cartItem ? 'in-cart' : ''}" data-id="${product.id}" ${stockLeft <= 0 ? 'disabled' : ''}>
            ${cartItem ? 'Added ✓' : 'Add'}
          </button>
        </div>
      </div>
    `;

    if (stockLeft > 0) {
      card.querySelector('.add-btn').addEventListener('click', () => {
        import('./cart.js').then(m => m.addItemToCart(product.id));
      });
    }

    productsGrid.appendChild(card);
  });
}

export function renderCart() {
  const cart  = getCart();
  const saved = getSavedItems();

  const subtotal    = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount    = calculateDiscount(subtotal);
  const afterDiscount = subtotal - discount;
  const freeShipping  = shouldFreeShipping() || afterDiscount >= freeShippingLimit;
  const shipping    = (!freeShipping && cart.length > 0) ? standardShippingFee : 0;
  const total       = afterDiscount + shipping;
  const totalQty    = cart.reduce((sum, item) => sum + item.qty, 0);

  cartBadge.textContent = totalQty;

  // shipping progress bar
  if (cart.length === 0) {
    shippingFill.style.width = '0%';
    shippingMessage.textContent = 'Add items to unlock free shipping';
  } else if (freeShipping) {
    shippingFill.style.width = '100%';
    shippingMessage.textContent = '🎉 Free shipping unlocked!';
  } else {
    const remaining = freeShippingLimit - afterDiscount;
    const percent   = (afterDiscount / freeShippingLimit) * 100;
    shippingFill.style.width = `${Math.min(percent, 100)}%`;
    shippingMessage.textContent = `Add $${remaining.toFixed(2)} more for free shipping`;
  }

  // cart items list
  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartSummary.style.display = 'none';
    cartItems.innerHTML = '';
  } else {
    cartEmpty.style.display = 'none';
    cartSummary.style.display = 'block';
    cartItems.innerHTML = '';

    cart.forEach(item => {
      const row = document.createElement('li');
      row.className = 'cart-item';
      row.innerHTML = `
        <span class="cart-item-emoji">${item.emoji}</span>
        <div class="cart-item-name">${item.name}</div>
        <div class="qty-controls">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
          <span class="qty-display" id="qty-${item.id}">${item.qty}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
          <button class="save-later-btn" data-action="saveLater" data-id="${item.id}" title="Save for later">📥</button>
          <button class="qty-btn remove-btn" data-action="delete" data-id="${item.id}">✕</button>
        </div>
        <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
      `;
      cartItems.appendChild(row);
    });

    // single delegated listener for all cart buttons
    cartItems.onclick = (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id     = parseInt(btn.dataset.id);
      const action = btn.dataset.action;

      import('./cart.js').then(m => {
        if (action === 'increase')  m.adjustQuantity(id, 1);
        if (action === 'decrease')  m.adjustQuantity(id, -1);
        if (action === 'delete')    m.removeItemWithUndo(id);
        if (action === 'saveLater') m.saveForLater(id);
      });
    };
  }

  // summary numbers
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  discountEl.textContent = `-$${discount.toFixed(2)}`;
  shippingEl.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
  totalEl.textContent    = `$${total.toFixed(2)}`;

  // saved for later section
  if (saved.length === 0) {
    savedSection.style.display = 'none';
  } else {
    savedSection.style.display = 'block';
    savedList.innerHTML = '';

    saved.forEach(item => {
      const li = document.createElement('li');
      li.className = 'saved-item';
      li.innerHTML = `
        <div class="saved-item-info">
          <span>${item.emoji}</span>
          <span>${item.name}</span>
          <span style="color:var(--muted);">$${item.price.toFixed(2)}</span>
        </div>
        <button class="move-to-cart-btn" data-saved-id="${item.id}">Move to cart</button>
      `;
      savedList.appendChild(li);
    });

    document.querySelectorAll('.move-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.savedId);
        import('./cart.js').then(m => m.moveToCartFromSaved(id));
      });
    });
  }
}

export function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const priceFilter = document.getElementById('price-filter');
  const clearBtn    = document.getElementById('clear-filters-btn');

  searchInput.addEventListener('input', (e) => {
    setSearchTerm(e.target.value);
    renderProducts();
  });

  priceFilter.addEventListener('change', (e) => {
    setPriceRange(e.target.value);
    renderProducts();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value  = '';
    priceFilter.value  = 'all';
    setSearchTerm('');
    setPriceRange('all');
    renderProducts();
  });
}

export function setupCoupon() {
  const couponInput = document.getElementById('coupon-input');
  const applyBtn    = document.getElementById('apply-coupon-btn');
  const feedback    = document.getElementById('coupon-feedback');

  applyBtn.addEventListener('click', async () => {
    const code     = couponInput.value.trim();
    const cart     = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const { applyCoupon } = await import('./coupon.js');
    const result = applyCoupon(code, subtotal);

    feedback.textContent  = result.message;
    feedback.style.color  = result.success ? '#2d5a3d' : '#a33028';

    if (result.success) {
      couponInput.value = '';
      renderCart();
      setTimeout(() => feedback.textContent = '', 3000);
    }
  });
}

export function setupCheckout() {
  const checkoutBtn = document.getElementById('checkout-btn');

  checkoutBtn.addEventListener('click', async () => {
    const cart     = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const discount     = calculateDiscount(subtotal);
    const freeShipping = shouldFreeShipping() || subtotal - discount >= freeShippingLimit;
    const shipping     = (!freeShipping && cart.length > 0) ? standardShippingFee : 0;
    const total        = subtotal - discount + shipping;

    alert(`Order placed! Total: $${total.toFixed(2)}\n✨ Thank you for shopping with us.`);

    const { clearCart, } = await import('./cart.js');
    const { removeCoupon } = await import('./coupon.js');
    clearCart();
    removeCoupon();
    renderCart();
    showToast('🧾 Order completed — cart cleared');
  });
}