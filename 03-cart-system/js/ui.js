// 

import { inventory, freeShippingLimit, standardShippingFee } from './data.js';
import { getCart, getSavedItems, findCartItem } from './cart.js';
import { filterProducts, setSearchTerm, setPriceRange } from './filters.js';
import { calculateDiscount, getActiveCoupon, shouldFreeShipping } from './coupon.js';

// DOM elements
let productsGrid, cartItems, cartBadge, cartEmpty, cartSummary;
let subtotalEl, shippingEl, discountEl, totalEl;
let savedSection, savedList;
let shippingFill, shippingMessage;
let toastEl, toastTimeout;

export function initUI() {
  // Cache DOM elements
  productsGrid = document.getElementById('products-grid');
  cartItems = document.getElementById('cart-items');
  cartBadge = document.getElementById('cart-badge');
  cartEmpty = document.getElementById('cart-empty');
  cartSummary = document.getElementById('cart-summary');
  subtotalEl = document.getElementById('subtotal');
  shippingEl = document.getElementById('shipping');
  discountEl = document.getElementById('discount');
  totalEl = document.getElementById('total');
  savedSection = document.getElementById('saved-section');
  savedList = document.getElementById('saved-items-list');
  shippingFill = document.getElementById('shipping-fill');
  shippingMessage = document.getElementById('shipping-message');
  toastEl = document.getElementById('toast');
}

export function showToast(message, duration = 2000, isUndo = false, undoItemId = null) {
  if (toastTimeout) clearTimeout(toastTimeout);
  
  toastEl.textContent = message;
  
  if (isUndo && undoItemId) {
    const undoBtn = document.createElement('button');
    undoBtn.textContent = ' Undo';
    undoBtn.style.marginLeft = '10px';
    undoBtn.style.background = 'white';
    undoBtn.style.color = '#2d5a3d';
    undoBtn.style.border = 'none';
    undoBtn.style.borderRadius = '20px';
    undoBtn.style.padding = '2px 8px';
    undoBtn.style.cursor = 'pointer';
    undoBtn.onclick = () => {
      import('./cart.js').then(module => {
        module.undoLastRemoval(undoItemId);
        toastEl.style.opacity = '0';
      });
    };
    toastEl.innerHTML = '';
    toastEl.appendChild(document.createTextNode(message));
    toastEl.appendChild(undoBtn);
  } else {
    toastEl.innerHTML = message;
  }
  
  toastEl.style.opacity = '1';
  toastTimeout = setTimeout(() => {
    toastEl.style.opacity = '0';
  }, duration);
}

export function renderProducts() {
  const filtered = filterProducts();
  productsGrid.innerHTML = '';
  
  filtered.forEach(product => {
    const inCart = !!findCartItem(product.id);
    const cartItem = findCartItem(product.id);
    const currentQty = cartItem ? cartItem.qty : 0;
    const stockLeft = product.stock - currentQty;
    
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
          <button class="add-btn ${inCart ? 'in-cart' : ''}" data-id="${product.id}" ${stockLeft <= 0 ? 'disabled' : ''}>
            ${inCart ? 'Added ✓' : 'Add'}
          </button>
        </div>
      </div>
    `;
    
    const addBtn = card.querySelector('.add-btn');
    if (addBtn && stockLeft > 0) {
      addBtn.addEventListener('click', () => {
        import('./cart.js').then(module => {
          module.addItemToCart(product.id);
        });
      });
    }
    
    productsGrid.appendChild(card);
  });
}

function animateQuantity(id) {
  const el = document.getElementById(`qty-${id}`);
  if (el) {
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 150);
  }
}

export function renderCart() {
  const cart = getCart();
  const saved = getSavedItems();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = calculateDiscount(subtotal);
  const discountedSubtotal = subtotal - discountAmount;
  const shippingFree = shouldFreeShipping() || discountedSubtotal >= freeShippingLimit;
  const shipping = (!shippingFree && cart.length > 0) ? standardShippingFee : 0;
  const total = discountedSubtotal + shipping;
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  
  // update badge
  cartBadge.textContent = itemCount;
  
  // update shipping ui
  if (cart.length === 0) {
    shippingFill.style.width = '0%';
    shippingMessage.textContent = 'Add items to unlock free shipping';
  } else if (shippingFree) {
    shippingFill.style.width = '100%';
    shippingMessage.textContent = '🎉 Free shipping unlocked!';
  } else {
    const remaining = freeShippingLimit - discountedSubtotal;
    const percent = (discountedSubtotal / freeShippingLimit) * 100;
    shippingFill.style.width = `${Math.min(percent, 100)}%`;
    shippingMessage.textContent = `Add $${remaining.toFixed(2)} more for free shipping`;
  }
  
  // show/hide empty state
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
    
    // event delegation for cart actions
    cartItems.onclick = (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = parseInt(btn.dataset.id);
      const action = btn.dataset.action;
      
      import('./cart.js').then(module => {
        if (action === 'increase') module.adjustQuantity(id, 1);
        if (action === 'decrease') module.adjustQuantity(id, -1);
        if (action === 'delete') module.removeItemWithUndo(id);
        if (action === 'saveLater') module.saveForLater(id);
      });
    };
  }
  
  // update summary
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  discountEl.textContent = `-$${discountAmount.toFixed(2)}`;
  shippingEl.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;
  
  // render saved items
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
        import('./cart.js').then(module => {
          module.moveToCartFromSaved(id);
        });
      });
    });
  }
}

export function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const priceFilter = document.getElementById('price-filter');
  
  searchInput.addEventListener('input', (e) => {
    setSearchTerm(e.target.value);
    renderProducts();
  });
  
  priceFilter.addEventListener('change', (e) => {
    setPriceRange(e.target.value);
    renderProducts();
  });
}

export function setupCoupon() {
  const couponInput = document.getElementById('coupon-input');
  const applyBtn = document.getElementById('apply-coupon-btn');
  const feedback = document.getElementById('coupon-feedback');
  
  applyBtn.addEventListener('click', async () => {
    const code = couponInput.value.trim();
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    
    const { applyCoupon } = await import('./coupon.js');
    const result = applyCoupon(code, subtotal);
    
    feedback.textContent = result.message;
    feedback.style.color = result.success ? '#2d5a3d' : '#a33028';
    
    if (result.success) {
      couponInput.value = '';
      renderCart();
      setTimeout(() => {
        feedback.textContent = '';
      }, 3000);
    }
  });
}

export function setupCheckout() {
  const checkoutBtn = document.getElementById('checkout-btn');
  checkoutBtn.addEventListener('click', async () => {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const { getActiveCoupon } = await import('./coupon.js');
    const { clearCart } = await import('./cart.js');
    
    const discount = calculateDiscount(subtotal);
    const shippingFree = shouldFreeShipping() || subtotal - discount >= freeShippingLimit;
    const shipping = (!shippingFree && cart.length > 0) ? standardShippingFee : 0;
    const total = subtotal - discount + shipping;
    
    alert(`Order placed! Total: $${total.toFixed(2)}\n✨ Thank you for shopping with us.`);
    clearCart();
    const { removeCoupon } = await import('./coupon.js');
    removeCoupon();
    renderCart();
    showToast('🧾 Order completed — cart cleared');
  });
}