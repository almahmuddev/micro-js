// 

// LocalStorage persistence
export function saveToLocalStorage(cart, savedItems) {
  localStorage.setItem('modular_cart', JSON.stringify(cart));
  localStorage.setItem('modular_saved', JSON.stringify(savedItems));
}

export function loadFromLocalStorage() {
  const storedCart = localStorage.getItem('modular_cart');
  const storedSaved = localStorage.getItem('modular_saved');
  return {
    cart: storedCart ? JSON.parse(storedCart) : [],
    savedItems: storedSaved ? JSON.parse(storedSaved) : []
  };
}