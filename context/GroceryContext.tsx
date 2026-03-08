import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryId } from "../constants/categories";
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
  clearBasket: () => void;
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
  const userVerified = auth.user ? auth.user.emailVerified : localUserVerified;
  const setUserVerified = setLocalUserVerified;
  const basketSyncSourceRef = useRef<"api" | "local">("api");

  const refreshProducts = useCallback(() => {
    fetchProducts()
      .then((list) => setProducts(list))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    if (!auth.token) {
      setAddresses([]);
      return;
    }
    let cancelled = false;
    getAddresses(auth.token)
      .then((list) => {
        if (!cancelled) setAddresses(list);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });
    return () => { cancelled = true; };
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token) {
      setBasket({});
      return;
    }
    let cancelled = false;
    getBasket(auth.token)
      .then((next) => {
        if (!cancelled) {
          basketSyncSourceRef.current = "api";
          setBasket(next);
        }
      })
      .catch(() => {
        if (!cancelled) setBasket({});
      });
    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token || basketSyncSourceRef.current !== "local") return;
    const items = Object.values(basket).map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));
    putBasket(auth.token, items)
      .then(() => {
        basketSyncSourceRef.current = "api";
      })
      .catch(() => {
        basketSyncSourceRef.current = "api";
      });
  }, [auth.token, basket]);

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

  const clearBasket = () => {
    basketSyncSourceRef.current = "local";
    setBasket({});
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
    clearBasket,
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

