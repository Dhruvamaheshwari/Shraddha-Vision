import React from 'react';
import { Heart, Eye, ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  wished: boolean;
  onWish: (product: Product) => void;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
}

export const ProductVisual: React.FC<{ product: Product; compact?: boolean }> = ({ product, compact }) => (
  <div className={`frame-visual shape-${product.shape.toLowerCase().replace('-', '')} ${compact ? 'frame-visual-compact' : ''}`} aria-label={`${product.shape} frame illustration`}>
    <span className="lens left" /><span className="bridge" /><span className="lens right" /><span className="temple left-temple" /><span className="temple right-temple" />
  </div>
);

export const ProductCard: React.FC<ProductCardProps> = ({ product, wished, onWish, onOpen, onAdd }) => {
  const saving = product.mrp - product.price;
  return (
    <article className="card bg-base-100 border border-base-300 overflow-hidden group">
      <div className="relative bg-base-200 p-5 cursor-pointer" onClick={() => onOpen(product)}>
        {product.tag && <span className="badge badge-primary badge-sm absolute left-3 top-3">{product.tag}</span>}
        <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2" aria-label="Save frame" onClick={(e) => { e.stopPropagation(); onWish(product); }}>
          <Heart size={17} className={wished ? 'fill-error text-error' : 'opacity-60'} />
        </button>
        <ProductVisual product={product} />
        <div className="flex justify-center gap-1.5 mt-5">
          {product.colors.map((color) => <span key={color} className="h-3 w-3 rounded-full border border-base-content/30 bg-neutral" title={color} />)}
        </div>
      </div>
      <div className="card-body p-4 gap-2">
        <div className="flex justify-between items-start gap-2">
          <div><p className="font-semibold leading-tight">{product.name}</p><p className="text-xs text-base-content/60">{product.code} · {product.brand}</p></div>
          <span className="badge badge-ghost badge-sm">{product.size}</span>
        </div>
        <p className="text-xs text-base-content/60">{product.shape} · {product.colors.join(' / ')}</p>
        <div className="flex items-end gap-2"><strong>₹{product.price.toLocaleString('en-IN')}</strong><del className="text-xs text-base-content/40">₹{product.mrp.toLocaleString('en-IN')}</del><span className="text-xs text-success">Save ₹{saving.toLocaleString('en-IN')}</span></div>
        <div className="card-actions mt-1 grid grid-cols-[1fr_auto]">
          <button className="btn btn-primary btn-sm" onClick={() => onAdd(product)}><ShoppingBag size={15} /> Add</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onOpen(product)}><Eye size={15} /> Quick view</button>
        </div>
      </div>
    </article>
  );
};

export const ProductStripCard: React.FC<{ product: Product; onOpen: (p: Product) => void }> = ({ product, onOpen }) => (
  <button className="card card-side bg-base-200 border border-base-300 p-3 text-left min-w-64 hover:border-primary transition-colors" onClick={() => onOpen(product)}>
    <ProductVisual product={product} compact />
    <div className="pl-3 self-center"><p className="font-semibold text-sm">{product.name}</p><p className="text-xs text-base-content/60">{product.shape} · {product.size}</p><p className="font-semibold mt-2">₹{product.price.toLocaleString('en-IN')}</p></div>
  </button>
);

export const SparkleLabel: React.FC = () => <span className="badge badge-secondary badge-sm gap-1"><Sparkles size={12} /> AI matched</span>;
