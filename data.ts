import { Order, Product } from './types';

export const products: Product[] = [
  { id: 'no-101', name: 'Aarav Classic', code: 'NO-101', brand: 'Nayan House', price: 1499, mrp: 2499, shape: 'Round', size: 'Medium', colors: ['Matte Black', 'Tortoise'], stock: 18, category: 'Eyeglasses', lens: ['Blue-cut', 'Anti-glare'], tag: 'Bestseller' },
  { id: 'no-102', name: 'Mira Cat-eye', code: 'NO-102', brand: 'Nayan House', price: 1899, mrp: 2999, shape: 'Cat-eye', size: 'Small', colors: ['Rose Gold', 'Berry'], stock: 9, category: 'Eyeglasses', lens: ['Blue-cut', 'Transitions'], tag: 'New arrival' },
  { id: 'no-103', name: 'Kabir Edge', code: 'NO-103', brand: 'The Edit', price: 2199, mrp: 3499, shape: 'Rectangle', size: 'Large', colors: ['Ink Blue', 'Charcoal'], stock: 5, category: 'Eyeglasses', lens: ['Anti-glare', 'Zero power'], tag: 'Low stock' },
  { id: 'no-104', name: 'Ira Sun', code: 'NO-104', brand: 'Suncraft', price: 2499, mrp: 3999, shape: 'Aviator', size: 'Medium', colors: ['Gold', 'Silver'], stock: 22, category: 'Sunglasses', lens: ['Polarised', 'UV400'], tag: 'UPF 50+' },
  { id: 'no-105', name: 'Dev Minimal', code: 'NO-105', brand: 'Nayan House', price: 1299, mrp: 1999, shape: 'Oval', size: 'Medium', colors: ['Crystal', 'Olive'], stock: 31, category: 'Eyeglasses', lens: ['Blue-cut', 'Anti-glare'], tag: 'Everyday' },
  { id: 'no-106', name: 'Zoya Studio', code: 'NO-106', brand: 'The Edit', price: 2799, mrp: 4299, shape: 'Geometric', size: 'Small', colors: ['Tortoise', 'Clear'], stock: 7, category: 'Eyeglasses', lens: ['Blue-cut', 'Transitions'], tag: 'Editor pick' },
  { id: 'no-107', name: 'Rohan Flex', code: 'NO-107', brand: 'Nayan Active', price: 1999, mrp: 2999, shape: 'Rectangle', size: 'Large', colors: ['Navy', 'Black'], stock: 14, category: 'Eyeglasses', lens: ['Anti-glare', 'Zero power'], tag: 'Flexible fit' },
  { id: 'no-108', name: 'Tara Weekend', code: 'NO-108', brand: 'Suncraft', price: 1699, mrp: 2499, shape: 'Round', size: 'Small', colors: ['Cocoa', 'Black'], stock: 12, category: 'Sunglasses', lens: ['Polarised', 'UV400'], tag: 'Weekend edit' },
  { id: 'no-109', name: 'Neel Blue-light', code: 'NO-109', brand: 'Nayan House', price: 1599, mrp: 2299, shape: 'Square', size: 'Medium', colors: ['Black', 'Smoke'], stock: 26, category: 'Eyeglasses', lens: ['Blue-cut', 'Anti-glare'], tag: 'Workday' },
  { id: 'no-110', name: 'Meera Luxe', code: 'NO-110', brand: 'The Edit', price: 3299, mrp: 4999, shape: 'Cat-eye', size: 'Medium', colors: ['Champagne', 'Black'], stock: 4, category: 'Eyeglasses', lens: ['Transitions', 'Anti-glare'], tag: 'Limited' },
];

export const orders: Order[] = [
  { id: 'NYN-2408', customer: 'Ananya Rao', date: 'Today, 10:42', amount: 2098, status: 'Processing', items: 2 },
  { id: 'NYN-2407', customer: 'Ritesh Menon', date: 'Yesterday', amount: 2499, status: 'Ready for pickup', items: 1 },
  { id: 'NYN-2406', customer: 'Kavya Shah', date: '12 Jun 2024', amount: 3898, status: 'Packed', items: 2 },
  { id: 'NYN-2405', customer: 'Arjun Mehta', date: '11 Jun 2024', amount: 1599, status: 'Delivered', items: 1 },
  { id: 'NYN-2404', customer: 'Sanya Iyer', date: '10 Jun 2024', amount: 6798, status: 'Delivered', items: 3 },
];

export const categories = ['All frames', 'Eyeglasses', 'Sunglasses', 'Blue-light', 'Kids', 'Premium'];
export const stores = [
  { city: 'Bandra West', address: '14 Linking Road, Mumbai', hours: '10:30 AM – 8:30 PM', distance: '1.8 km' },
  { city: 'Indiranagar', address: '100 Feet Road, Bengaluru', hours: '10:00 AM – 9:00 PM', distance: '3.2 km' },
  { city: 'Vasant Kunj', address: 'DLF Promenade, New Delhi', hours: '11:00 AM – 9:00 PM', distance: '5.6 km' },
];
