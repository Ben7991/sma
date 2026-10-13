# Pretotype Features

High-level capability map for the sales and operations pretotype. Each area describes what users need to accomplish and what the system should make visible or actionable.

---

## Handle Sales

End-to-end support for recording revenue and following up on money still owed.

### Record sales

Capture completed or in-progress sales at the point of transaction. A sale should tie together the customer (when known), line items (products and quantities), pricing, discounts or adjustments, payment method, and timestamp. Users can confirm the sale, print or share a receipt summary, and see the sale reflected in reports and inventory where applicable.

### Track pending payments by customers

See which customers owe money and how much remains on each sale or account. Support partial payments, due dates or payment terms where relevant, and a clear status (e.g. paid, partially paid, overdue). Staff can record a payment against an open balance and update the customer’s outstanding total without re-entering the full sale.

---

## Manage Customers

Maintain a single place for customer identity and relationship context used across sales and payments.

Create and update customer profiles (name, contact details, notes). Search and filter customers when recording sales or reviewing balances. View a customer’s history of purchases and open or settled payments so front-line staff can answer questions quickly without switching tools.

---

## Manage Inventory

Control what can be sold at the store and how stock levels change over time.

### Restock products

Increase on-hand quantity when new stock arrives (purchase, transfer, or correction). Restock actions should record who performed them, when, and optionally reference a supplier or document number. Quantities update immediately so sales and availability views stay accurate.

### View available stocks

Browse products with current on-hand quantities, low-stock indicators, and basic product attributes (SKU, name, unit). Filter or sort by category, location, or stock level so reordering and selling decisions are based on live numbers, not spreadsheets.

---

## Warehouse management

Separate warehouse stock from store-floor inventory while keeping movement between them traceable.

### Track products currently available in warehouse

See what is stored in the warehouse by product and quantity, distinct from store stock. Support location or bin context if needed for larger warehouses. This view is the source of truth for what can be moved to the store without double-counting the same units in two places.

### Restock store with inventory from warehouse

Transfer defined quantities from warehouse to store in one operation. The pretotype should decrement warehouse availability and increment store availability atomically, with an audit trail (who transferred, when, and what was moved). Prevents selling from the store what has not yet been received from the warehouse.

---

## Manage employees

Onboard staff and control what each person can do in the system through roles.

### Add new employees and assign configured roles to them

Register employees with essential details (name, contact, employment status). Attach one or more predefined roles (e.g. cashier, inventory clerk, manager) that bundle permissions for sales, customers, inventory, warehouse, and settings. Role changes should take effect for new sessions so access stays aligned with responsibility without sharing individual accounts.
