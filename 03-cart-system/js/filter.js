// 

import { inventory } from './data.js';

let currentSearchTerm = '';
let currentPriceRange = 'all';

export function filterProducts() {
  return inventory.filter(product => {
    // Search filter
    const matchesSearch = currentSearchTerm === '' || 
      product.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      product.sub.toLowerCase().includes(currentSearchTerm.toLowerCase());
    
    // Price filter
    let matchesPrice = true;
    if (currentPriceRange === 'under30') {
      matchesPrice = product.price < 30;
    } else if (currentPriceRange === '30-60') {
      matchesPrice = product.price >= 30 && product.price <= 60;
    } else if (currentPriceRange === 'over60') {
      matchesPrice = product.price > 60;
    }
    
    return matchesSearch && matchesPrice;
  });
}

export function setSearchTerm(term) {
  currentSearchTerm = term;
}

export function setPriceRange(range) {
  currentPriceRange = range;
}

export function getCurrentFilters() {
  return { search: currentSearchTerm, priceRange: currentPriceRange };
}