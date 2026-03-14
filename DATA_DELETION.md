# How to delete all data manually

This guide explains how to delete user data and other app data manually (for compliance, testing, or reset).

---

## 1. Backend (database)

The app uses **PostgreSQL** and **Prisma**. All user-linked data lives in the DB.

### Option A: Delete one user and their data

Run against your database (replace `USER_ID` with the real user id, e.g. from `users` table):

```sql
-- Replace 'USER_ID' with the actual user id (e.g. clxyz123...)
DELETE FROM cart_items WHERE user_id = 'USER_ID';
DELETE FROM wishlist_items WHERE user_id = 'USER_ID';
DELETE FROM addresses WHERE user_id = 'USER_ID';
-- Orders reference addresses; delete order lines first, then orders
DELETE FROM order_lines WHERE order_id IN (SELECT id FROM orders WHERE user_id = 'USER_ID');
DELETE FROM orders WHERE user_id = 'USER_ID';
DELETE FROM otp_codes WHERE user_id = 'USER_ID';
DELETE FROM users WHERE id = 'USER_ID';
```

To find a user by phone:

```sql
SELECT id, phone, name, role FROM users WHERE phone = '+97699123456';
```

### Option B: Delete all users and their data (full reset)

**Warning: this removes every user, cart, wishlist, address, and order.**

```sql
DELETE FROM order_lines;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM wishlist_items;
DELETE FROM addresses;
DELETE FROM otp_codes;
DELETE FROM users;
```

### How to run these

1. **Local:**  
   - With Docker:  
     `docker exec -it <postgres_container_name> psql -U <user> -d <database_name>`  
   - Or use a GUI (pgAdmin, DBeaver, etc.) connected to `DATABASE_URL`.

2. **Hosted (e.g. Render, Railway):**  
   - Open the DB dashboard and use the SQL console, or connect with `psql` using the provided connection string.

3. **Using Prisma (no raw SQL):**  
   You can add a script in the backend that uses Prisma to delete in the right order (e.g. delete orders then addresses then user). Example for deleting one user:

   ```ts
   await prisma.orderLine.deleteMany({ where: { order: { userId: userId } } });
   await prisma.order.deleteMany({ where: { userId } });
   await prisma.cartItem.deleteMany({ where: { userId } });
   await prisma.wishlistItem.deleteMany({ where: { userId } });
   await prisma.address.deleteMany({ where: { userId } });
   await prisma.otpCode.deleteMany({ where: { userId } });
   await prisma.user.delete({ where: { id: userId } });
   ```

---

## 2. App (device) – auth and cache

- **Auth:** Token and user are stored in **AsyncStorage** under:
  - `@asaangaa/auth_token`
  - `@asaangaa/auth_user`
- **Cache:** Other keys may be used by the app (e.g. product cache). Clearing app data or uninstalling clears everything on the device.

To clear only auth (e.g. “log out and remove my data from this device”): log out from the app; that removes the stored token and user. Any data that exists only on the server (orders, addresses, etc.) must be deleted on the backend as in section 1.

---

## 3. Backend migration after schema change

After switching to phone-only auth, run a migration so the DB matches the schema (e.g. `email` nullable, `phone` unique):

```bash
cd backend
npx prisma migrate dev --name phone_only_auth
```

Then, if you use seed to create an admin by phone:

```bash
npx prisma db seed
```

Set `ADMIN_PHONE` in `.env` if you want a specific admin number (e.g. `ADMIN_PHONE=+97699119911`).

---

## Summary

| Goal                         | Where              | Action |
|-----------------------------|--------------------|--------|
| Delete one user + data     | Database           | Run the “Option A” SQL (or Prisma equivalent) for that user. |
| Delete all users + data     | Database           | Run the “Option B” SQL. |
| Clear auth on device       | App (AsyncStorage)  | Log out; optionally clear app data / reinstall. |
| Apply schema + reseed       | Backend            | `npx prisma migrate dev` then `npx prisma db seed` if needed. |
