// 

// apply coupon based on purchase
const validCoupons = {
  SAVE10: { type: 'percent', value: 10, minSpend: 30 },
  FREESHIP: { type: 'free_shipping', minSpend: 0 },
  WELCOME20: { type: 'fixed', value: 20, minSpend: 50 }
};

let activeCoupon = null;

export function applyCoupon(code, subtotal) {
  const coupon = validCoupons[code.toUpperCase()];
  
  if (!coupon) {
    return { success: false, message: 'Invalid coupon code' };
  }
  
  if (subtotal < coupon.minSpend) {
    return { success: false, message: `Minimum spend $${coupon.minSpend} required` };
  }
  
  activeCoupon = { ...coupon, code: code.toUpperCase() };
  
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = (subtotal * coupon.value) / 100;
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }
  
  return { success: true, message: `Coupon applied!`, discount, couponType: coupon.type };
}

export function removeCoupon() {
  activeCoupon = null;
}

export function getActiveCoupon() {
  return activeCoupon;
}

export function calculateDiscount(subtotal) {
  if (!activeCoupon) return 0;
  if (activeCoupon.type === 'percent') {
    return (subtotal * activeCoupon.value) / 100;
  } else if (activeCoupon.type === 'fixed') {
    return Math.min(activeCoupon.value, subtotal);
  }
  return 0;
}

export function shouldFreeShipping() {
  return activeCoupon?.type === 'free_shipping';
}