# SMA feature guide

SMA is a multi-tenant application for wholesale and retail store owners. Each business (a tenant) runs its own shop, warehouses, staff, customers, stock, and sales. One tenant never sees another tenant’s data.

The product covers the work of a trading day: who is allowed to do what, who the customers and suppliers are, what is in the shop and in the warehouse, what was sold, what is still owed, and what still has to be delivered. It also gives customers a way to place an order, and gives the owner reports they can export.

This document describes the intended behavior of each feature and the operating suggestions that keep stock and money trustworthy. The shorter capability map for the current pretotype is in [pretotype-features.md](./pretotype-features.md).

In the current phase, each tenant runs exactly one shop. Support for several shops per tenant is planned for a later phase. [One shop now, more shops later](#one-shop-now-more-shops-later) explains what that means for each feature, and what has to be in place now so the change later is a configuration change rather than a rebuild.

[Non-functional requirements](#non-functional-requirements) lists the guarantees every feature keeps: correct money and stock figures, safe retries on a weak network, tenant isolation, and recovery from failure.

## Glossary

| Term | Meaning |
| --- | --- |
| Tenant | One business using SMA. The tenant admin owns settings, staff, and data for that business. |
| Shop | A location that sells to customers. Stock here is what can be sold at the counter. In the current phase a tenant has exactly one shop. |
| Warehouse | A location that stores bulk stock. Stock here is moved to a shop before it is sold. Setting up a warehouse to sell directly comes in a later phase. |
| Sale | Goods sold to a customer, with line items, prices, payment, and a balance due. This is the customer’s purchase. |
| Supply order | Goods the tenant asks a supplier to send. Stock increases only when those goods are received. |
| Arrears | The part of a customer’s balance that is still unpaid and past the agreed terms. |
| Customer balance | The full amount a customer still owes, including amounts that are not yet due. |
| System role | A role shipped with SMA. Tenants can view it and copy it. They cannot change or delete it. |
| Tenant role | A role created by a tenant admin, either from a copy of a system role or from an empty permission set. |

Use “sale” for anything the business sells, and “supply order” for anything the business buys in. Using “purchase” for both makes reports and staff training ambiguous.

## One shop now, more shops later

### Current phase: one shop per tenant

Each tenant has exactly one shop. The shop is created with the tenant during setup, and it cannot be deleted. Its name, address, and receipt details can be edited.

A tenant can still have warehouses alongside that one shop. Stock moves from a warehouse to the shop and between warehouses as described in [Warehouses and warehouse inventory](#warehouses-and-warehouse-inventory). A shop-to-shop transfer does not exist yet, because there is no second shop.

Because there is only one shop, the interface does not ask the user to pick one:

- Screens open on the tenant’s shop. There is no shop switcher. A location switcher appears only when the tenant has at least one warehouse, and it lists the shop and the warehouses.
- Shop filters are hidden on lists, reports, and exports. Reports cover the one shop, plus warehouses where the report includes stock.
- Assigning an employee to a shop is automatic. Location limits on a role apply only to warehouses.
- The tenant has one customer order link, which belongs to its shop.

### Build it so a second shop is a data change

Every record that belongs to a location stores its location from the start, even though there is only one shop. This applies to sales, payments, stock movements, stock levels, reorder levels, transfers, goods receipts, deliveries, till closes, expenses, and order links. Employee location assignments are stored the same way.

Hiding the shop selector is a display decision. The data and the permission checks always carry a shop. When a second shop arrives, no historical record needs to be rewritten, and existing reports keep their figures.

These stay tenant-wide in both phases:

- The product master (name, SKU, barcode, category, units, prices)
- Customers, their balances, credit limits, and statements. A customer who buys at two shops has one balance.
- Suppliers
- Roles and employees
- Document number series. An invoice number stays unique across the whole tenant.

### Later phase: more than one shop per tenant

When multiple shops are supported, the owner can add, update, and retire shops from account management, like warehouses. The following changes take effect:

- **Shop switcher.** People assigned to more than one location see a switcher listing shops and warehouses separately. Owners and other roles with access to every location also get an “All locations” view for dashboards and reports.
- **Role location limits.** Assigning a person to specific shops becomes meaningful. A cashier at one shop does not see another shop’s sales, stock, or till.
- **Shop-to-shop transfers.** Transfers gain the shop-to-shop direction, with the same in-transit rules.
- **Order links per shop.** Each shop gets its own stable order link and ordering window. Orders arrive as draft sales at that shop.
- **Reports by shop.** Every report gains a shop filter and a consolidated total, and the daily sales report shows one closing view per shop.
- **Till close per shop.** Each shop closes its own till.
- **Per-shop settings.** Each shop can have its own receipt header, reorder levels, and ordering window. Prices stay on the shared product master unless a later decision adds per-shop prices.
- **Customer balances across shops.** A payment taken at one shop can clear a sale made at another, because the balance sits on the customer, not the shop.

## Foundations

These rules apply across shops, warehouses, sales, and reports. Features below assume them.

### Stock is a ledger

Every change in quantity is a movement: goods received, transfer, sale, return, damage, loss, or a stock-count adjustment. The on-hand quantity is the sum of those movements. Each movement records the person, the time, the product, the location, the quantity, and the document that caused it.

Three quantities are visible for a product at a location:

- **On hand** — units physically at that location.
- **Reserved** — units held for a confirmed sale that has not left yet.
- **Available** — on hand minus reserved. This is what can still be sold or transferred.

A transfer moves quantity from one location to another in a single operation, so the same units are never counted in two places. Goods that have left the source and have not been received at the destination are in transit.

### One product, more than one way to sell it

A product has a name, SKU, optional barcode, category, unit, cost price, retail price, and active or retired status. Wholesale and retail sell the same product in different units and at different prices. A carton and a single piece stay the same product, with a conversion (for example, 1 carton = 24 pieces), so receiving in cartons and selling in pieces keeps one stock figure.

Wholesale customers use a wholesale price. Walk-in retail customers use the retail price. Cost price is visible only to people whose role allows it, because margin reports depend on it and floor staff do not need it to sell.

### Money sits on the customer account

A payment is recorded once and then allocated across one or more open sales. A customer can owe several sales and clear them with a single lump sum. The customer screen shows the running balance and which sales produced it.

Each customer can have a credit limit and payment terms, such as pay now, net 7 days, or net 30 days. A new credit sale warns the seller when it would pass the credit limit or when the customer already has overdue sales.

### Documents have a status, and history stays

A sale moves through draft, confirmed, ready for delivery, out for delivery, delivered, and cancelled. Staff can edit a sale that has not been delivered. The edit releases the previous stock reservation, writes the new lines, and reserves stock again. The activity log keeps both versions.

After a sale is delivered or fully paid, corrections are made with a return (a credit note). The return puts stock back and reduces what the customer owes. The original sale stays as it was.

Customers, suppliers, employees, and products are retired rather than erased. Retired records can be restored. Past sales, payments, and stock movements keep the original name.

### Documents people can refer to

Sales, supply orders, goods receipts, transfers, receipts, and returns each get a human number unique to the tenant, such as `INV-0041` or `TRF-0012`. Receipts and statements show the business name and that number. Accountants, drivers, and customers use these numbers in conversation.

Exports to Excel and PDF are available on the lists described below. An export uses the same filters as the screen, requires its own permission, and is written to the activity log.

## Role management

The tenant admin controls what each person can do. SMA ships with system roles. The admin can copy one and adjust it, or create a role with no permissions and add only what that job needs.

### System roles

System roles are available to every tenant and are marked with a clear System badge in the role list. They can be viewed and duplicated. They cannot be edited or deleted. The shipped set is:

- **Owner** — full access, including cost prices, settings, exports, and role management.
- **Manager** — shops, stock, sales, customers, suppliers, delivery, and reports for the locations they are assigned to. Cost prices are included.
- **Cashier** — sell, take payment, print receipts, and look up customers at assigned shops. Cost prices and profit stay hidden. Discount is capped.
- **Inventory clerk** — receive stock, adjust stock, and transfer within assigned locations.
- **Warehouse keeper** — warehouse stock, goods receipt, and transfers out of assigned warehouses.
- **Driver** — deliveries assigned to that driver, including proof of delivery and cash collected on delivery.
- **Accountant** — view sales, payments, balances, and reports, and export them. No selling and no stock changes.

### Tenant roles

A tenant role is created in one of two ways:

- **Build on a system role.** Duplicate a system role. The copy belongs to the tenant and starts with that role’s permissions. The admin then adds or removes permissions.
- **Start from scratch.** Create an empty role and turn on only the permissions the job needs.

Tenant roles can be renamed, updated, and deleted. Deletion is refused while any employee still has the role. The admin reassigns those employees first. The role list shows system roles and tenant roles together, with the System badge as the distinction. Filters separate the two groups.

### What a role can limit

Permissions are the actions a person may take: sell, edit an undelivered sale, record a payment, adjust stock, manage warehouses, manage employees, export, and so on. A few limits sit on top of those actions, because they are the ones that protect a shop:

- **Locations.** The person sees only the shops and warehouses they are assigned to. In the current phase every employee is assigned to the tenant’s one shop, so this limit only narrows which warehouses a person sees.
- **Cost and profit.** Hidden unless the role allows them.
- **Discount ceiling.** The largest discount this role may give on a line or on a sale. A cashier might be capped at a small percentage. A manager can go higher. The owner is uncapped.
- **Sensitive actions.** Voiding a sale, adjusting stock, changing a price, and exporting are separate switches.
- **Own work only.** A driver sees assigned deliveries. They do not open the full sales list.

Role changes apply to the person’s next session, so an updated role does not depend on sharing accounts.

## Employee management

The tenant invites staff into the business, sees who is active, and decides what each person may do.

### Invite

The admin invites an employee by phone or email. The invitation contains a link the employee uses to set their own password. Until they accept, the employee appears as invited. There is one account per person. Staff do not share logins.

The employee record holds name, contact details, employment status, assigned role, and assigned shops or warehouses.

### List, resign, and rehire

The employee list shows everyone in the tenant: invited, active, and resigned. From a person’s row the admin can change the role, change locations, resign them, or rehire them.

Resigning closes access immediately and keeps the person on historical sales, payments, stock movements, and deliveries. Rehiring restores that same record and access, rather than creating a second person with the same name.

### Export

The employee list exports to Excel and PDF with the current filters, including status and role. Export requires the export permission and is recorded in the activity log.

## Customer management

Customers are the people and businesses the tenant sells to. One profile is used at the counter, on credit sales, on delivery, and on reports.

### Profile

Staff can add a customer, update their details, retire them, and restore them. A profile holds:

- Name and contact details
- Notes
- Customer type: retail or wholesale
- Price list (retail or wholesale)
- Credit limit and payment terms
- Whether they have agreed to receive product messages on WhatsApp, and when they agreed
- Status: active or retired

Retired customers stay on old sales. They can be restored when they buy again. Search and filters cover name, phone, type, and status, including from the sales screen so the seller can attach the right customer without leaving the sale.

### Balance and arrears

Opening a customer shows:

- Purchase history
- Each open, partly paid, and paid sale
- Payments and which sales they were allocated to
- The running balance
- Arrears: unpaid amounts that are past the payment terms, and the sales they came from

From this screen, staff can record a payment, print or share a statement, and see a warning when the customer is over the credit limit or has overdue sales.

### Export

The customer list and a single customer’s statement export to Excel and PDF. The statement is the document to share when collecting arrears: sales, payments, and the balance, with the business name and the customer’s name.

## Shop inventory

Shop inventory is the stock available to sell at a shop. Each shop is a location. In the current phase a tenant has one shop, so shop inventory is the tenant’s sellable stock. When several shops are supported, each shop has its own quantities and a person sees the shops their role allows.

### What staff can do

- Browse products at a shop with on-hand, reserved, and available quantities
- See a low-stock marker when available quantity is at or below the reorder level for that shop
- Filter and sort by category, product, and stock level
- Receive stock into the shop, with the person, the time, and an optional supplier or document number
- Adjust stock after a count, damage, or loss, with a reason
- Sell from available quantity (see Sales)

Scanning a barcode finds the product on receiving and on a sale. The product master (name, SKU, barcode, category, units, prices) is shared by every location. Quantities are always per shop or per warehouse.

### Export

The shop stock list exports to Excel and PDF for the selected shop and filters.

## Warehouses and warehouse inventory

Warehouses hold bulk stock separately from the shop floor. A tenant can own several warehouses, in both the current phase and later ones. In a later phase, a location can also be a shop that sells from bulk stock, for a cash-and-carry counter. Until then, the tenant’s one shop is the only location that sells.

### Warehouses

The admin can add, update, and retire warehouses. A warehouse has a name, address or notes, and status. Retired warehouses stay on historical transfers and receipts. Stock views default to active warehouses.

### Stock in a warehouse

The warehouse stock list is the source of truth for what can be moved to a shop. It shows the same three quantities as the shop: on hand, reserved, and available, by product. Larger warehouses can record a bin or area for a product. Low-stock markers use the reorder level for that warehouse.

### Moving stock

Staff create a transfer for a defined quantity of one or more products:

- Warehouse to shop
- Warehouse to warehouse
- Shop to shop, once a tenant can have more than one shop

The transfer is sent from the source and received at the destination. Until it is received, the quantity is in transit and is not available at either location for a new sale. The record stores who sent it, who received it, when, and what moved. Available quantity at the source is checked before the transfer is sent, so staff cannot move units the shop has already reserved for a customer.

### Export

Warehouse lists and transfer lists export to Excel and PDF.

## Suppliers and new supplies

Suppliers are the businesses the tenant buys from. Supply orders are how new stock is requested. Receiving the goods is how warehouse or shop stock increases.

### Suppliers

Staff can add a supplier, update their details, retire them, and restore them. A supplier moves through four statuses:

1. **Incomplete** — the record exists and is missing details required to order.
2. **Verified** — name, phone, and how they are paid are present. The tenant treats this as concrete enough to request supplies.
3. **Active** — the tenant currently buys from them.
4. **Retired** — they stay on old orders and receipts and can be restored.

A supply order can be created only for a verified or active supplier.

### Supply orders and receiving

A supply order lists products, quantities, expected unit cost, and the warehouse or shop that should receive them. Creating the order does not change stock. It is a request.

When goods arrive, staff record a goods receipt against the order. The receipt can be partial. Received quantities increase on-hand stock at the destination and are written to the stock ledger with the receipt number. The order shows what was requested, what has arrived, and what is still outstanding.

A return to a supplier reduces on-hand stock and reduces what the tenant owes that supplier. The original receipt stays in history.

### Export

Supplier lists, supply orders, and goods receipts export to Excel and PDF.

## Sales

Sales are how the tenant records revenue, prints a receipt, and follows money that is still owed. The same sale document supports a counter sale and a wholesale order that will be delivered.

### Recording a sale

A sale ties together:

- The shop
- The customer, when known
- Line items: product, unit, quantity, and price
- Discounts, within the seller’s discount ceiling
- Payment method and the amount paid now
- The balance due
- The seller and the time

A counter sale is confirmed, paid in whole or in part, and stock is reduced or reserved immediately. A wholesale order can stay partly paid or on credit, within the customer’s terms and credit limit. Prices come from the customer’s price list. A walk-in retail sale uses the retail price.

Confirming a sale reserves or reduces available stock at the shop. The sale receives the next invoice number.

### Receipts

Staff can print a receipt and share it, including on WhatsApp. The receipt shows the business name, the invoice number, line items, the total, the amount paid, the balance due, and the time.

### Payments

Staff record a payment against the customer without re-entering the sale. The payment stores the amount, the method (cash, mobile money, bank transfer, card), the person who recorded it, and the time. The amount is allocated to one or more open sales. Each sale then shows paid, partly paid, or unpaid, and the customer balance updates.

### Editing before delivery

Staff can change lines, quantities, prices, and discounts on a sale that has not been delivered. Saving the edit updates the stock reservation and writes the previous and new versions to the activity log. A sale that has been delivered, or that needs a correction after it was fully paid, is corrected with a return.

### Preparing for delivery

Staff mark a confirmed sale as ready for delivery when it has been picked. That status means the goods are packed and waiting for a driver or for the customer to collect. The delivery note can be printed from the sale.

### Export

The sales list exports to Excel and PDF with the current filters: shop, status, payment status, customer, seller, and date.

## Delivery and drivers

This area is for tenants whose staff or riders take orders to customers. It tracks what is waiting to go, what is out, and what has been delivered, and by whom.

### Assignment and status

From sales that are ready for delivery, staff assign an order to a driver. The delivery then moves through:

- Assigned
- Out for delivery
- Delivered
- Failed
- Returned

The record stores the driver, the time of each status, and, on failure, a reason so the shop can reschedule. Staff can set a group of ready orders to out for delivery, and can mark deliveries complete.

A driver sees the deliveries assigned to them. They can update status and record proof of delivery: recipient name, a note, and an optional photo. They do not need the full sales list.

### Cash collected on delivery

When the customer pays the driver, that amount is a payment on the customer’s sale and a sum the driver is still holding. The owner’s list shows cash collected by each driver that has not yet been handed in at the shop. Handing in clears the driver’s holding and keeps the customer’s payment in place.

### Export

Delivery lists export to Excel and PDF, filtered by driver, status, and date.

## Product advertisement

When a product is added or restocked, the tenant can tell customers about it on WhatsApp. Each send is either to one customer or to a chosen group.

### Who can be messaged

A message goes only to customers who have agreed to receive product messages. The agreement and the date are stored on the customer. The audience for a bulk send is a filtered set of those customers, such as all opted-in wholesale customers, or all opted-in customers.

Messages are sent through a WhatsApp Business setup, using an approved template, so the tenant’s number stays in good standing. The message includes the product photo, the price, and a link that opens the order form with that product selected.

### The send log

Every send is stored: product, audience, sender, time, and result. The log is the list behind this feature. It exports to Excel and PDF.

## Customer ordering

Customers can build and submit an order without a staff account. The tenant gives them a link. Staff still confirm the order before it affects stock.

### The link

Each shop has one stable order link. In the current phase that means one link per tenant. When several shops are supported, each shop gets its own link and its own ordering window. The tenant generates a link once and reuses it. The link accepts new orders during a daily window of about 12 hours (for example, 06:00 to 18:00). Outside that window the page tells the customer when ordering opens again. The link does not change from day to day, so a message or a saved chat keeps working.

The customer identifies themselves on the form. The order then uses their wholesale or retail price, their payment terms, and their current balance. They can see their own submitted orders. They cannot see other customers or the tenant’s stock costs.

### What happens to the order

A submitted order arrives as a draft sale for that shop. Staff review it, confirm it, and only then reserve stock. From there it follows the normal sale path: payment, picking, delivery, and receipt.

The list of orders that arrived through the link exports to Excel and PDF.

## Reports

Reports answer the questions an owner asks at the end of the day and at the end of the month. Each report uses the stock ledger, the sales, and the payments, so the figures match the screens. Filters include date range and, where it matters, customer, product, or employee. A shop filter and a consolidated total are added once a tenant can have more than one shop. Until then, reports cover the tenant’s one shop, plus warehouses where the report includes stock. Every report exports to Excel and PDF.

- **Customer purchases and arrears.** Sales per customer, amount paid, balance, and aging buckets: not yet due, 1–30 days, 31–60, 61–90, and over 90. Each balance opens into the sales that created it.
- **Products that sell and products that do not.** Quantity and value sold in the period, and products with stock that have not sold. On-hand quantity is shown beside the slow movers.
- **Paid and unpaid sales.** Fully paid, partly paid, and unpaid sales, with the balance remaining.
- **Delivered and not yet delivered.** Sales by delivery status, including who delivered them.
- **Sales by employee.** Sales issued or handled by each employee, for the shops in the filter.
- **Daily sales.** Totals by payment method, and by shop once there is more than one. This is the closing view.
- **Stock value and gross profit.** Stock on hand at cost, and profit by product, for roles that are allowed to see cost.

## System features

### Activity log

The activity log is an append-only history for the tenant. Each entry records the person, the action, the record that changed, the previous value, the new value, and the time. It always records price changes, discounts, voids, stock adjustments, role changes, payments, resignations, and exports. The log can be filtered and exported to Excel and PDF. Entries are not edited or deleted.

### Account management

The tenant admin manages the business itself:

- Business name, contact details, and the details printed on receipts
- The shop’s details, and warehouses. Adding and retiring shops comes with the multi-shop phase.
- Currency and tax settings
- Number series for invoices, supply orders, transfers, receipts, and returns
- Their own password, and a second sign-in step for the owner

Employees manage their own password from their account. Closing or resigning an employee is done from employee management, and it is written to the activity log.

## Non-functional requirements

The features above describe what SMA does. This section describes the guarantees it keeps while doing it: figures that are always right, actions that survive a dropped connection, and one tenant’s data never reaching another. These requirements apply from the first build step, not after it. Numeric targets are starting values to confirm once real usage data exists.

### Correctness of money

- **No floating-point money.** Amounts are stored as whole numbers in the currency’s smallest unit (pesewas for cedis), with the tenant’s currency recorded alongside. Quantities that can be fractional, such as kilograms, use a fixed number of decimal places per unit.
- **One rounding rule.** Line totals are rounded half-up to the smallest unit, then summed. Discounts, taxes, and allocations use the same rule everywhere: on the screen, on the receipt, in reports, and in exports.
- **The server computes totals.** The device shows totals for convenience. The server recalculates prices, discounts, taxes, and balances from the stored lines and rejects a sale whose totals do not match.
- **Balances follow from records.** A customer’s balance is always their confirmed sales, minus returns, minus payments. A stored balance figure is a cache of that sum, never an independent number someone can edit.
- **Allocations add up.** The amounts allocated from a payment never exceed the payment, and never exceed the balance of the sale they are allocated to. Any unallocated part stays on the customer as credit.
- **Prices are copied onto documents.** A sale line stores the product name, unit, price, cost, and discount at the moment of sale. Changing a product’s price later never changes a past sale, receipt, or report.

### Correctness of stock

- **The ledger is the only source.** On-hand quantity is the sum of stock movements. Stored stock levels are kept in step with the ledger in the same transaction, and a reconciliation job recomputes them from the ledger every night. Any difference is reported to the owner and written to the activity log.
- **Stock cannot go negative.** A sale, transfer, or adjustment that would take available quantity below zero is refused. An owner who chooses to allow negative stock for a shop turns that on as a setting, and every movement that goes negative is flagged.
- **Two people, one last unit.** When two staff sell or transfer the last units at the same time, exactly one succeeds. The other sees a clear message with the current available quantity. Stock reservations use a check that is safe when two requests arrive together, not a read followed by a separate write.
- **Edits do not overwrite each other.** Each sale, supply order, and transfer carries a version. If two people edit the same undelivered sale, the second save is refused and that person is shown what changed.

### Operations that complete fully or not at all

Each of these runs as a single transaction. If any part fails, nothing is saved:

- Confirming a sale: assigning the invoice number, writing the lines, reserving or reducing stock, and recording any payment taken at the counter
- Recording a payment and its allocations
- Sending a transfer, and receiving it
- Recording a goods receipt against a supply order
- Recording a return and its stock and balance effects
- Resigning an employee and closing their access

The activity log entry for a change is written in the same transaction as the change itself. A change that is saved always has its log entry, and a failed change leaves none.

### Document numbers

- Numbers are unique within a tenant and a series, such as `INV-` or `TRF-`.
- A number is assigned when the document is confirmed, inside the confirming transaction, so a failed confirmation does not use one up. Confirmed invoices therefore have no gaps.
- A cancelled sale keeps its number and is marked cancelled. A number is never reused.
- Drafts, including orders that arrive through the customer link, use a separate draft reference until they are confirmed.

### Safe retries on a weak network

Shops lose connectivity in the middle of work, so every action that changes data must be safe to send twice.

- **Every change has a request ID.** The device generates an ID when a person starts an action, such as starting a sale, recording a payment, or updating a delivery. The server records it. If the same ID arrives again, the server returns the original result instead of creating a second sale, payment, or movement.
- **Visible state for unsent work.** The interface shows clearly when an action is still sending, has been saved, or has failed. A person is never left guessing whether to press the button again.
- **Offline selling, when it arrives.** Sales made offline are kept on the device in the order they were made and sent when the connection returns. A sale that can no longer go through, for example because the stock was sold elsewhere, is kept and shown to the cashier and manager for a decision. It is never dropped without notice.
- **Light pages.** Screens used at the counter load and respond quickly on a mid-range Android phone over a 3G connection. Lists load in pages, and images are sized for the screen.

### Outside services never block a sale

WhatsApp messages, emailed or texted invitations, and file exports depend on services outside SMA, and those services sometimes fail.

- Calls to outside services go through a queue and are retried with increasing delays. A failure is recorded in the send log or the activity log with the reason.
- A sale, payment, or delivery is saved whether or not its WhatsApp receipt is sent. The receipt stays available to print or to share again.
- Large exports run in the background. The person is told when the file is ready, and the screen stays usable in the meantime.
- Background jobs, such as reconciliation, the closing summary, reorder suggestions, and arrears aging, are safe to run twice and record when they last succeeded.

### Tenant isolation

- Every read and write is limited to the signed-in person’s tenant at the data layer, not only in the interface. The limit is enforced in one shared place so that a new screen or report cannot forget it.
- Automated tests try to read and change another tenant’s records through each part of the system and must fail every time.
- Record IDs that appear in links cannot be guessed. Public links, such as the order link and shared statements, contain a long random token and can be revoked.
- Files that are exported, uploaded, or attached, such as delivery photos and statements, are stored per tenant and served only to people with access.

### Permissions enforced on the server

- Every permission, location limit, and discount ceiling is checked on the server for every request. Hiding a button is a convenience, not a control.
- Cost prices and profit are removed from data sent to people whose role does not allow them, including in exports, search results, and printouts.
- Resigning an employee ends their sessions immediately. A role change applies at the person’s next session, and no later than a short session lifetime.
- The customer order link identifies a customer by a code sent to their phone before it shows their balance, payment terms, or past orders.

### Accounts and sign-in

- Passwords are stored with a slow, salted hashing method and are never logged or shown.
- The owner signs in with a second step. Other roles can turn it on.
- Repeated failed sign-ins, order-link submissions, and invitation requests are rate-limited per person, phone number, and network address.
- Invitation and password-reset links expire and work once.

### Availability and recovery

- **Trading hours matter most.** SMA targets 99.5% availability during each tenant’s trading hours. Planned maintenance happens outside those hours and is announced in the app beforehand.
- **Selling comes first.** Reports and exports run on separate capacity from selling, so a heavy month-end report cannot slow the counter.
- **Backups.** Data is backed up automatically, with point-in-time recovery. No more than 15 minutes of confirmed data may be lost in a failure, and service is restored within 4 hours.
- **Restores are rehearsed.** A restore to a separate environment is tested at least every quarter, and the result is recorded.
- **Tenant data can leave.** The owner can export all of the business’s records in a documented format, both for their own records and if they stop using SMA.

### Data that outlives its users

- Customers, suppliers, products, employees, shops, and warehouses are retired, not deleted. Database constraints prevent removing anything that a sale, payment, or movement still refers to.
- Financial records, stock movements, and the activity log are kept for at least the period local tax law requires. The exact period is confirmed with an accountant before launch.
- Consent to product messages is stored with its date and source. An opt-out takes effect before the next send.
- Personal data such as phone numbers and addresses is kept out of application logs and error reports.

### Time

- Times are stored in UTC and shown in the tenant’s time zone.
- The business day, the daily sales report, the till close, and the order link’s daily window all use the tenant’s time zone and the shop’s opening hours, not the server’s clock.

### Seeing problems early

- Every request and background job is logged with the tenant, the person, and a request ID, so one sale can be traced from the device to the database.
- The team is alerted when error rates rise, when queued messages pile up, when an offline sync fails, when a reconciliation finds a difference, and when a backup does not complete.
- WhatsApp template approval status and send failure rates are monitored, so a rejected template is noticed before customers stop receiving messages.

### Tests that protect correctness

- Ledger and balance rules are tested with generated sequences of sales, returns, payments, transfers, and adjustments. After every sequence, stock and balances must equal the sums of their records.
- Concurrency tests run two sales against the last unit, and two edits against the same sale, and check that exactly one of each succeeds.
- Retry tests send the same request twice and check that only one record is created.
- End-to-end tests cover a counter sale, a credit sale paid in two parts, a delivered order with cash collected by a driver, and a return after full payment.
- Database changes are made so that the old and new versions of the application can run during a deployment without errors or downtime.

### Decisions needed

These choices affect correctness and should be settled before the features that depend on them are built:

1. **Negative stock.** Is it refused everywhere, or can an owner allow it per shop? This document assumes refused by default.
2. **Invoice gaps.** Do local tax rules require gapless invoice numbers, including across cancellations? This document assumes no gaps among confirmed invoices, with cancelled ones kept.
3. **Editing a partly paid sale.** If an undelivered sale with a part payment is edited down below what was paid, does the difference become customer credit or a refund?
4. **Driver cash disputes.** What happens when the cash a driver hands in does not match what they recorded as collected?
5. **Prices during a sale.** If a product’s price changes while a draft sale is open, does the draft keep the old price or take the new one?
6. **Retention period.** How long must financial and personal records be kept, and when may personal data be removed for a customer who asks?

## Suggestions

These sit beside the features above. They are the practices that keep a wholesale and retail business from outgrowing the software in the first month.

### Returns

Customer returns put units back into available stock and reduce the customer’s balance. Supplier returns reduce stock and reduce what the tenant owes. The original sale or receipt remains. Staff use a return once a sale has been delivered or fully paid, instead of rewriting that document.

### Reorder suggestions

Each product at each location has a reorder level. A suggestion list proposes what to order from how fast the product has been selling, how much is available, and how long the supplier usually takes. The owner acts from that list. The supply order can be started from a suggestion for a verified supplier.

### Till close

At the end of the day, each shop counts cash and mobile money and compares the count with the payments recorded that day. The difference is stored with the person who closed and the time. Owners use this to see whether the drawer matches the system.

### Expenses

Rent, transport, wages, and similar costs are recorded as expenses with a date, an amount, a category, and a shop. Sales reports then stay sales reports. A later profit view can subtract expenses from gross profit.

### Customer statements

A statement PDF for one customer — sales, payments, and balance — is the document to send on WhatsApp when collecting arrears. It is more useful day to day than a spreadsheet of every customer.

### Alerts to the owner

The owner is notified about low stock, an overdue balance, a failed delivery, a discount above the seller’s ceiling, and a new order from the customer link. A short closing summary covers the day’s sales, cash, mobile money, new arrears, and items below the reorder level.

### Selling when the network is weak

Shops often lose connectivity in the middle of a sale. The sale is identified on the device at the moment it is started, so a later version of the product can save the sale locally and sync it when the connection returns, without creating a second invoice. The rules that make this safe are in [Safe retries on a weak network](#safe-retries-on-a-weak-network).

## Suggested build order

Build in an order that lets a shop sell and collect money before adding reach and extra control.

1. **Run today’s shop.** Business profile, the tenant’s one shop, products with units, the stock ledger, customers, counter sales, partial payments, receipts, balances, employee invites, system roles, and the daily sales and arrears views.
2. **Run wholesale.** Warehouses and transfers, supplier verification, supply orders and goods receipts, wholesale prices, credit limits, delivery assignment and proof of delivery, and returns.
3. **Reach customers.** The stable order link with a daily window, WhatsApp receipts and statements, then opt-in product announcements.
4. **Give the owner control.** Tenant roles with location, cost, and discount limits, profit and stock-value reports, stock counts, reorder suggestions, till close, expenses, and the closing summary.
5. **Run more than one shop.** Adding and retiring shops, the shop switcher and “All locations” view, shop-level role assignments, shop-to-shop transfers, an order link per shop, and shop filters with consolidated totals on reports. See [Later phase: more than one shop per tenant](#later-phase-more-than-one-shop-per-tenant).

The [non-functional requirements](#non-functional-requirements) apply from step 1. Money stored in whole minor units, the stock ledger with its reconciliation, request IDs for safe retries, tenant isolation, and backups are part of running today’s shop, not later hardening.

Steps 1 to 4 run with one shop per tenant. Every record still stores its shop from step 1, so step 5 adds screens and settings rather than migrating data.

Excel and PDF export ships with each list, through one export path, with the same permission and the same filters as the screen.
