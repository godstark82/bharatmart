import type { CartItem } from "@/lib/providers/InquiryProvider";
import { formatFullAddress, loadLocation } from "@/lib/location";

export const CHECKOUT_WHATSAPP_NUMBER = "9983944688";

function formatMoneyINR(amount: number) {
  try {
    return new Intl.NumberFormat("en-IN").format(amount);
  } catch {
    return String(amount);
  }
}

export function buildCheckoutMessage(items: CartItem[]) {
  const loc = loadLocation();
  const locationLine = `Delivery Address:\n${formatFullAddress(loc)}`;
  const instructionsLine =
    loc?.deliveryInstructions && loc.deliveryInstructions.trim().length > 0
      ? `Delivery Instructions: ${loc.deliveryInstructions.trim()}`
      : null;
  const defaultLine =
    loc?.isDefaultAddress ? "Default Address: Yes" : loc ? "Default Address: No" : null;

  const lines: string[] = [];
  lines.push("BharatMart - Cart Checkout");
  lines.push(locationLine);
  if (instructionsLine) lines.push(instructionsLine);
  if (defaultLine) lines.push(defaultLine);
  lines.push(`Time: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("Items:");

  let total = 0;
  items.forEach((i, idx) => {
    const unit = Number(i.price) || 0;
    const qty = Number(i.qty) || 0;
    const subtotal = unit * qty;
    total += subtotal;
    lines.push(
      `${idx + 1}. ${i.title} | Qty: ${qty} | ₹${formatMoneyINR(unit)} | Subtotal: ₹${formatMoneyINR(subtotal)}`
    );
    lines.push(`   Product: /product/${i.productId}`);
    if (i.sellerId) lines.push(`   SellerId: ${i.sellerId}`);
  });

  lines.push("");
  lines.push(`Total Items: ${items.reduce((s, i) => s + (Number(i.qty) || 0), 0)}`);
  lines.push(`Total Amount: ₹${formatMoneyINR(total)}`);

  return lines.join("\n");
}

export function buildWhatsAppCheckoutUrl(items: CartItem[]) {
  const message = buildCheckoutMessage(items);
  const number = CHECKOUT_WHATSAPP_NUMBER.replace(/[^\d]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

