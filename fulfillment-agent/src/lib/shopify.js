import { getShopifyAccessToken } from "./shopify-auth.js";

const shop = process.env.SHOPIFY_SHOP_DOMAIN;

export async function getOrder(orderId) {
  if (!shop) {
    throw new Error("Missing SHOPIFY_SHOP_DOMAIN");
  }

  const token = await getShopifyAccessToken();

  const response = await fetch(
    `https://${shop}/admin/api/2026-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token
      },
      body: JSON.stringify({
        query: `
          query GetOrder($id: ID!) {
            order(id: $id) {
              id
              name
              displayFinancialStatus
              displayFulfillmentStatus
              createdAt
              lineItems(first: 50) {
                nodes {
                  title
                  quantity
                  sku
                }
              }
            }
          }
        `,
        variables: {
          id: orderId
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify API returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(
      `Shopify GraphQL error: ${result.errors[0].message}`
    );
  }

  return result.data?.order ?? null;
}
