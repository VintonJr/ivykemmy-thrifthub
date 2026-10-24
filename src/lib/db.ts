import "server-only";
import * as fileStore from "./store/file";
import * as postgresStore from "./store/postgres";

// Products and orders. With POSTGRES_URL (or DATABASE_URL) set, they live in Supabase/PostgreSQL;
// without it, in data/store.json so the shop runs locally with no setup.

const store = postgresStore.databaseUrl() ? postgresStore : fileStore;

export { HOLD_MINUTES, UnavailableError, type ProductFilter } from "./store/common";

export const {
  listProducts,
  getProduct,
  listSizes,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  getOrder,
  getOrderByReference,
  listOrders,
  markOrderPaid,
  setOrderStatus,
} = store;
