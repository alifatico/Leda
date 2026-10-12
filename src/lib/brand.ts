/**
 * Product name, in one place. "Preventivissimo" replaced "Preventivo Lampo"
 * on 12 October 2026, because that name belongs to an unrelated mobile app
 * (preventivolampo.it). To rename again: change BRAND, then the domain
 * (APP_URL), BUSINESS_NAME on Vercel and the public name and product names
 * in Stripe. APP_ID is the internal slug written into Stripe metadata and
 * used for derived secrets: change it only before the first real sale.
 */
export const BRAND = "Preventivissimo";
export const APP_ID = "preventivissimo";
