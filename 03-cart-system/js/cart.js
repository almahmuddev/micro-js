// 

import { inventory } from './data.js';
import { saveToLocalStorage } from './storage.js';

// State
let myCart = [];
let savedItems = [];
let pendingRemoval = null;
let undoTimeout = null;
let listeners = []; // for UI updates

// Subscribe to changes
export function subscribeToCartChanges(callback) {
  listeners.push(callback);
}

function notifyListeners() {
  listeners.forEach(cb => cb());
}

// Helper functions
export function findCartItem(itemId) {
  return myCart.find(item => item.id === itemId) || null;
}

export function findSavedItem(itemId) {
  return savedItems.find(item => item.id === itemId);
}

// Core cart operations
export function addItemToCart(itemId, quantity = 1) {
  const product = inventory.find(p => p.id === itemId);
  if (!product) return false;
  
  const existing = findCartItem(itemId);
  const currentQty = existing ? existing.qty : 0;
  const newQty = currentQty + quantity;
  
  // Stock check
  if (newQty > product.stock) {
    showToastMessage(`❌ Only ${product.stock} left in stock`, 2000);
    return false;
  }
  
  if (existing) {
    myCart = myCart.map(item =>
      item.id === itemId ? { ...item, qty: newQty } : item
    );
    showToastMessage(`➕ ${product.name} quantity increased`);
  } else {
    myCart.push({ ...product, qty: quantity });
    showToastMessage(`✨ ${product.name} added to cart`);
  }
  
  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
  return true;
}

export function adjustQuantity(itemId, amount) {
  const item = findCartItem(itemId);
  if (!item) return;
  
  const product = inventory.find(p => p.id === itemId);
  const newQty = item.qty + amount;
  
  if (newQty <= 0) {
    removeItemWithUndo(itemId);
    return;
  }
  
  if (newQty > product.stock) {
    showToastMessage(`❌ Only ${product.stock} left in stock`, 2000);
    return;
  }
  
  myCart = myCart.map(item =>
    item.id === itemId ? { ...item, qty: newQty } : item
  );
  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
  showToastMessage(amount > 0 ? `➕ ${item.name} +1` : `➖ ${item.name} -1`);
}

export function removeItemWithUndo(itemId) {
  const item = findCartItem(itemId);
  if (!item) return;
  
  // Store for undo
  pendingRemoval = { ...item };
  myCart = myCart.filter(i => i.id !== itemId);
  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
  
  // Show undo toast
  showUndoToast(`${item.name} removed`, itemId);
  
  // Set auto-clear
  if (undoTimeout) clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => {
    pendingRemoval = null;
  }, 5000);
}

export function undoLastRemoval(itemId) {
  if (pendingRemoval && pendingRemoval.id === itemId) {
    addItemToCart(pendingRemoval.id, pendingRemoval.qty);
    pendingRemoval = null;
    if (undoTimeout) clearTimeout(undoTimeout);
    showToastMessage(`↩️ ${pendingRemoval?.name || 'Item'} restored`);
  }
}

export function saveForLater(itemId) {
  const cartItem = findCartItem(itemId);
  if (!cartItem) return;
  
  myCart = myCart.filter(i => i.id !== itemId);
  
  if (!findSavedItem(itemId)) {
    const { qty, ...productWithoutQty } = cartItem;
    savedItems.push(productWithoutQty);
    showToastMessage(`📥 ${cartItem.name} saved for later`);
  }
  
  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
}

export function moveToCartFromSaved(itemId) {
  const saved = findSavedItem(itemId);
  if (!saved) return;
  
  savedItems = savedItems.filter(i => i.id !== itemId);
  addItemToCart(itemId, 1);
  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
  showToastMessage(`↩️ ${saved.name} moved to cart`);
}

export function clearCart() {
  myCart = [];
  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
  showToastMessage('🧹 Cart cleared');
}

// Getters
export function getCart() {
  return [...myCart];
}

export function getSavedItems() {
  return [...savedItems];
}

export function setCartAndSaved(cart, saved) {
  myCart = cart || [];
  savedItems = saved || [];
  notifyListeners();
}

// Toast helper (will be replaced by UI module later)
let showToastMessage = (msg, duration) => console.log(msg);
let showUndoToast = (msg, itemId) => console.log(msg);

export function setToastHandlers(toastFn, undoFn) {
  showToastMessage = toastFn;
  showUndoToast = undoFn;
}