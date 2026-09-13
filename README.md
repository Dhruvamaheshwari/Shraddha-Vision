# Nayan Optical

A responsive React + TypeScript prototype for an eyewear e-commerce storefront and optical shop administration system.

## Included source

- `app.tsx`: React entry point
- `components/`: Customer storefront, product cards, admin dashboard, and application shell
- `data.ts`: Realistic demonstration inventory and dashboard data
- `types.ts`: Shared TypeScript models
- `styles.css`: Responsive styling and CSS-rendered eyewear artwork
- `tasklet.config.json`: Tasklet Instant App configuration
- `PRODUCT_BRIEF.md`: Product and interaction requirements

## Run inside Tasklet

This folder is a Tasklet Instant App. Open the folder as an app preview in its Tasklet thread. Tasklet supplies React, ReactDOM, DaisyUI, Tailwind CSS, and Lucide React during the preview build.

## Run as a standalone project

To run outside Tasklet, create a standard React + TypeScript application (for example with Vite), copy `app.tsx`, `components/`, `data.ts`, `types.ts`, and `styles.css` into its `src` directory, install `lucide-react`, and ensure Tailwind CSS plus DaisyUI are configured. Then mount `app.tsx` from the application's HTML root element.

## Scope

This package is an interactive front-end prototype using in-memory demonstration data. Production functionality requires a backend and integrations such as Django REST Framework, PostgreSQL, Redis/Celery, image storage, Razorpay, OTP, messaging, maps, PDF invoicing, and computer-vision search.
