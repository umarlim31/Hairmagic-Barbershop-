import { WHATSAPP_NUMBER } from "./booking-config";

export const SHOP_NAME = "Hairmagic Barbershop";
export const SHOP_ADDRESS = "Jl. Belibis Raya No. 06";
export const MAPS_URL = "https://maps.app.goo.gl/wMh3XUV4UL3ocaoF6";
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(`${SHOP_NAME}, ${SHOP_ADDRESS}, Indonesia`)}&output=embed`;
export const INSTAGRAM_URL = "https://www.instagram.com/hairmagic_barbershop/";
export function whatsappLink(message = "Halo Hairmagic, saya ingin bertanya tentang layanan dan reservasi.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
