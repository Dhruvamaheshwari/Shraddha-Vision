# Nayan Optical interactive prototype

Build a premium, original, responsive eyewear e-commerce and optical shop management Instant App. This is a polished product prototype, not a production Django deployment.

## Brand and UX
- Brand: Nayan Optical. Original, modern, warm Indian optical brand.
- Responsive mobile/tablet/desktop. Strong information hierarchy, product imagery can use tasteful CSS illustrated eyeglass silhouettes rather than remote images.
- Customer and Admin modes via obvious switch.
- English/Hindi toggle, translating all important visible navigation and core labels.
- Every visible control should produce a meaningful interaction: filtering, navigation, toast, modal, state change, cart update, wishlist, etc.

## Customer storefront
- Header/logo, search field with mic and image-upload buttons, user/cart controls, category chips.
- Natural-language queries such as “black round glasses under ₹2000” should visibly filter mock inventory.
- Simulated image-search upload flow with image preview and similar-results state.
- Home sequence: Search, Categories, New Arrivals, Best Sellers, Offers, Recommended Frames, Visit Store, Reviews.
- Use 8–12 realistic Indian-market products. Cards show name/code/brand/price/discount/colors/shape/size/stock/lens options, wishlist and quick-view.
- Product detail modal/page with gallery-like visuals, specs, lens selection, prescription selection, add to cart, buy now, share, and simulated virtual try-on.
- Cart drawer/modal with quantity, coupon (use NAYAN20), prescription/lens/address, GST/delivery/order summary and checkout confirmation.
- Account area/modal tabs: profile, orders, saved prescriptions, wishlist, recent, notifications. Include prescription form fields SPH/CYL/AXIS both eyes, ADD, PD, date, doctor, upload.
- Appointment booking modal, store details/directions, support/WhatsApp affordance.

## Admin panel
- Sidebar/nav and dashboard overview with Sales, Orders, Customers, Products, Lens Stock, Low Stock Alerts, Search Analytics, Suppliers, Reports.
- KPI cards and charts implemented with CSS/SVG, no external package required.
- Products table with add product modal or interaction, edit/stock actions.
- Orders with status chips and progression interaction.
- Customers/search and brief history.
- Lens inventory table with low-stock thresholds and acknowledged alert semantics, supplier reorder action and no-repeat explanation.
- Search analytics: searched/viewed/purchased/wishlisted, keywords, image searches, zero-result searches, brand/shape/price charts.
- Suppliers and reports with mock export buttons.

## Implementation constraints
- React TSX Instant App using DaisyUI and lucide-react only. Follow /tasklet/system/capabilities/interface-management/building-instant-apps.md.
- Split components into sensible files, keeping app.tsx thin.
- Do not use hardcoded hex/Tailwind palette colors for UI. Use DaisyUI semantic tokens; custom chart colors only if needed.
- No fetch, no external URLs, no localStorage. Mock data in source is acceptable because this is a prototype with no live connection.
- Avoid browser alert/prompt/confirm; use in-app modals and toasts.
- Ensure TypeScript compiles. After editing, do not preview; parent will preview and handle build feedback.
