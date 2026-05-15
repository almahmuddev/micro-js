// 

import { initUI, renderProducts, renderCart, setupFilters, setupCoupon, setupCheckout, showToast } from './ui.js';
import { subscribeToCartChanges, setToastHandlers, getCart, getSavedItems, setCartAndSaved } from './cart.js';
import { loadFromLocalStorage } from './storage.js';

// initialize the application
function init() {
  // load previously saved data
  const { cart, savedItems } = loadFromLocalStorage();
  setCartAndSaved(cart, savedItems);
  
  // Setting up ui
  initUI();
  
  // setting up toast handlers
  setToastHandlers(showToast, (msg, id) => showToast(msg, 5000, true, id));
  
  // subscribe to cart changes
  subscribeToCartChanges(() => {
    renderProducts();
    renderCart();
  });
  
  // setup event listeners
  setupFilters();
  setupCoupon();
  setupCheckout();
  
  // initial render
  renderProducts();
  renderCart();
}

// start the application
init();