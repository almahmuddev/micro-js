import { inventory } from './data.js';
import { saveToLocalStorage } from './storage.js';

// -- state --
let myCart = [];
let savedItems = [];
let pendingRemoval = null;
let undoTimeout = null;
let listeners = [];

// anyone can subscribe to cart updates
export function subscribeToCartChanges(callback) {
  listeners.push(callback);
}

function notifyListeners() {
  listeners.forEach(cb => cb());
}

// ---- helpers ---

export function findCartItem(itemId) {
  return myCart.find(item => item.id === itemId) || null;
}

export function findSavedItem(itemId) {
  return savedItems.find(item => item.id === itemId);
}

// --- core cart actions ----

export function addItemToCart(itemId, quantity = 1) {
  const product = inventory.find(p => p.id === itemId);
  if (!product) return false;

  const existing = findCartItem(itemId);
  const currentQty = existing ? existing.qty : 0;
  const newQty = currentQty + quantity;

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

  // hitting zero that means remove it (with undo)
  if (newQty <= 0) {
    removeItemWithUndo(itemId);
    return;
  }

  if (newQty > product.stock) {
    showToastMessage(`❌ Only ${product.stock} left in stock`, 2000);
    return;
  }

  myCart = myCart.map(i =>
    i.id === itemId ? { ...i, qty: newQty } : i
  );

  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
  showToastMessage(amount > 0 ? `➕ ${item.name} +1` : `➖ ${item.name} -1`);
}

export function removeItemWithUndo(itemId) {
  const item = findCartItem(itemId);
  if (!item) return;

  // keep a copy in case the user wants it back
  pendingRemoval = { ...item };
  myCart = myCart.filter(i => i.id !== itemId);

  saveToLocalStorage(myCart, savedItems);
  notifyListeners();
  showUndoToast(`${item.name} removed`, itemId);

  // auto-clear the pending removal after 5s
  if (undoTimeout) clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => {
    pendingRemoval = null;
  }, 5000);
}

export function undoLastRemoval(itemId) {
  if (!pendingRemoval || pendingRemoval.id !== itemId) return;

  const { name, qty } = pendingRemoval;
  pendingRemoval = null;
  if (undoTimeout) clearTimeout(undoTimeout);

  addItemToCart(itemId, qty);
  showToastMessage(`↩️ ${name} restored`);
}

export function saveForLater(itemId) {
  const cartItem = findCartItem(itemId);
  if (!cartItem) return;

  myCart = myCart.filter(i => i.id !== itemId);

  // avoid duplicates in saved list
  if (!findSavedItem(itemId)) {
    const { qty, ...product } = cartItem;
    savedItems.push(product);
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

// --- getters ----

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


let showToastMessage = (msg, duration) => console.log(msg);
let showUndoToast = (msg, itemId) => console.log(msg);

export function setToastHandlers(toastFn, undoFn) {
  showToastMessage = toastFn;
  showUndoToast = undoFn;
}