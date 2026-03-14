import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryId } from "../constants/categories";
import {
  getCached,
  setCached,
  PRODUCTS_CACHE_TTL_MS,
  BASKET_CACHE_TTL_MS,
  ADDRESSES_CACHE_TTL_MS,
  CACHE_KEYS,
} from "../lib/cache";
import { getAddresses, createAddress } from "../lib/addresses-api";
import { getBasket, putBasket } from "../lib/basket-api";
import { fetchProducts } from "../lib/products-api";
import { useAuth } from "./AuthContext";

export type { CategoryId };
export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  unit: string;
  description?: string;
  images: string[];
  tags?: string[];
};

export type BasketItem = {
  product: Product;
  quantity: number;
};

type Basket = Record<string, BasketItem>;

export type SavedAddress = {
  id: string;
  fullName?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  instructions?: string;
};

type GroceryContextValue = {
  products: Product[];
  refreshProducts: () => void;
  basket: Basket;
  wishlist: Set<string>;
  addToBasket: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  total: number;
  addresses: SavedAddress[];
  addAddress: (address: Omit<SavedAddress, "id">) => Promise<SavedAddress>;
  checkoutItems: BasketItem[] | null;
  setCheckoutItems: (items: BasketItem[] | null) => void;
  checkoutAddress: SavedAddress | null;
  setCheckoutAddress: (addr: SavedAddress | null) => void;
  removeCheckoutItemsFromBasket: (items: BasketItem[]) => void;
  userVerified: boolean;
  setUserVerified: (verified: boolean) => void;
};

const GroceryContext = createContext<GroceryContextValue | undefined>(
  undefined
);

export const GroceryProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const auth = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [basket, setBasket] = useState<Basket>({});
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<BasketItem[] | null>(null);
  const [checkoutAddress, setCheckoutAddress] = useState<SavedAddress | null>(null);
  const [localUserVerified, setLocalUserVerified] = useState(false);
  const userVerified = auth.user ? auth.user.verified : localUserVerified;
  const setUserVerified = setLocalUserVerified;
  const basketSyncSourceRef = useRef<"api" | "local">("api");
  const putBasketTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshProducts = useCallback(() => {
    fetchProducts()
      .then((list) => {
        setProducts(list);
        setCached(CACHE_KEYS.products, list, PRODUCTS_CACHE_TTL_MS);
      })
      .catch(() => setProducts([]));
  }, []);

  // Products: cache-first, then revalidate after a short delay when we have cache to avoid bursting the server
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    getCached<Product[]>(CACHE_KEYS.products).then((cached) => {
      if (cancelled) return;
      if (cached?.length) setProducts(cached);
      const delayMs = (cached?.length ?? 0) > 0 ? 1200 : 0;
      timeoutId = setTimeout(() => {
        fetchProducts()
          .then((list) => {
            if (!cancelled) {
              setProducts(list);
              setCached(CACHE_KEYS.products, list, PRODUCTS_CACHE_TTL_MS);
            }
          })
          .catch(() => {
            if (!cancelled) setProducts([]);
          });
      }, delayMs);
    });
    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, []);


  const userCacheKey = auth.user?.id ?? (auth.token ? "session" : null);

  // Addresses: cache-first when logged in, then revalidate after delay to avoid burst with products/basket
  useEffect(() => {
    if (!auth.token) {
      setAddresses([]);
      return;
    }
    const key = userCacheKey ? CACHE_KEYS.addresses(userCacheKey) : null;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (key) {
      getCached<SavedAddress[]>(key).then((cached) => {
        if (!cancelled && Array.isArray(cached) && cached.length >= 0) setAddresses(cached);
      });
    }
    timeoutId = setTimeout(() => {
      getAddresses(auth.token!)
        .then((list) => {
          if (!cancelled) {
            setAddresses(list);
            if (key) setCached(key, list, ADDRESSES_CACHE_TTL_MS);
          }
        })
        .catch(() => {
          if (!cancelled) setAddresses([]);
        });
    }, 600);
    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [auth.token, userCacheKey]);

  // Basket: cache-first when logged in, then revalidate after delay to avoid burst with products/addresses
  useEffect(() => {
    if (!auth.token) {
      setBasket({});
      return;
    }
    const key = userCacheKey ? CACHE_KEYS.basket(userCacheKey) : null;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (key) {
      getCached<Basket>(key).then((cached) => {
        if (!cancelled && cached && typeof cached === "object") {
          basketSyncSourceRef.current = "api";
          setBasket(cached);
        }
      });
    }
    timeoutId = setTimeout(() => {
      getBasket(auth.token!)
        .then((next) => {
          if (!cancelled) {
            basketSyncSourceRef.current = "api";
            setBasket(next);
            if (key) setCached(key, next, BASKET_CACHE_TTL_MS);
          }
        })
        .catch(() => {
          if (!cancelled) setBasket({});
        });
    }, 900);
    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [auth.token, userCacheKey]);

  // Debounced basket sync: one PUT per burst of changes (saves many requests)
  useEffect(() => {
    if (!auth.token || basketSyncSourceRef.current !== "local") return;
    if (putBasketTimeoutRef.current) clearTimeout(putBasketTimeoutRef.current);
    putBasketTimeoutRef.current = setTimeout(() => {
      putBasketTimeoutRef.current = null;
      const items = Object.values(basket).map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      putBasket(auth.token!, items)
        .then((next) => {
          basketSyncSourceRef.current = "api";
          setBasket(next);
          const key = userCacheKey ? CACHE_KEYS.basket(userCacheKey) : null;
          if (key) setCached(key, next, BASKET_CACHE_TTL_MS);
        })
        .catch(() => {
          basketSyncSourceRef.current = "api";
        });
    }, 1500);
    return () => {
      if (putBasketTimeoutRef.current) {
        clearTimeout(putBasketTimeoutRef.current);
        putBasketTimeoutRef.current = null;
      }
    };
  }, [auth.token, basket, userCacheKey]);

  const addToBasket = (product: Product) => {
    basketSyncSourceRef.current = "local";
    setBasket((current) => {
      const existing = current[product.id];
      const nextQuantity = existing ? existing.quantity + 1 : 1;
      return {
        ...current,
        [product.id]: { product, quantity: nextQuantity },
      };
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    basketSyncSourceRef.current = "local";
    setBasket((current) => {
      if (quantity <= 0) {
        const copy = { ...current };
        delete copy[productId];
        return copy;
      }

      const existing = current[productId];
      if (!existing) return current;

      return {
        ...current,
        [productId]: { ...existing, quantity },
      };
    });
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  };

  const removeCheckoutItemsFromBasket = (items: BasketItem[]) => {
    basketSyncSourceRef.current = "local";
    setBasket((current) => {
      const next = { ...current };
      for (const item of items) {
        const existing = next[item.product.id];
        if (!existing) continue;
        const newQty = existing.quantity - item.quantity;
        if (newQty <= 0) delete next[item.product.id];
        else next[item.product.id] = { ...existing, quantity: newQty };
      }
      return next;
    });
  };

  const addAddress = useCallback(async (address: Omit<SavedAddress, "id">): Promise<SavedAddress> => {
    if (auth.token) {
      const created = await createAddress(auth.token, address);
      setAddresses((prev) => [created, ...prev]);
      return created;
    }
    const next: SavedAddress = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...address,
    };
    setAddresses((prev) => [next, ...prev]);
    return next;
  }, [auth.token]);

  const total = useMemo(
    () =>
      Object.values(basket).reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
    [basket]
  );

  const value: GroceryContextValue = {
    products,
    refreshProducts,
    basket,
    wishlist,
    addToBasket,
    updateQuantity,
    toggleWishlist,
    total,
    addresses,
    addAddress,
    checkoutItems,
    setCheckoutItems,
    checkoutAddress,
    setCheckoutAddress,
    removeCheckoutItemsFromBasket,
    userVerified,
    setUserVerified,
  };

  return (
    <GroceryContext.Provider value={value}>
      {children}
    </GroceryContext.Provider>
  );
};

export const useGrocery = () => {
  const ctx = useContext(GroceryContext);
  if (!ctx) {
    throw new Error("useGrocery must be used within GroceryProvider");
  }
  return ctx;
};

