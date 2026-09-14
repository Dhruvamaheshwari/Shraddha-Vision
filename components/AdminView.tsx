import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { AlertTriangle, BarChart3, Bell, Boxes, Check, ChevronRight, Download, FileText, LayoutDashboard, Package, Pencil, Plus, Search, Settings2, ShoppingCart, Store, Users, X, Trash2 } from 'lucide-react';
import { orders } from '../data';
import useProductStore from '../store/productStore';
import useOrderStore from '../store/orderStore';
import { AdminView as AdminViewType, Order, Product } from '../types';

interface AdminViewProps { view: AdminViewType; setView: (view: AdminViewType) => void; toast: (message: string, tone?: 'success' | 'info' | 'warning') => void; }

const nav: Array<{ id: AdminViewType; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> }, { id: 'products', label: 'Products', icon: <Boxes size={17} /> }, { id: 'orders', label: 'Orders', icon: <ShoppingCart size={17} /> }, { id: 'customers', label: 'Customers', icon: <Users size={17} /> }, { id: 'lens', label: 'Lens stock', icon: <Package size={17} /> }, { id: 'analytics', label: 'Search analytics', icon: <BarChart3 size={17} /> }, { id: 'suppliers', label: 'Suppliers', icon: <Store size={17} /> }, { id: 'reports', label: 'Reports', icon: <FileText size={17} /> },
];

export const AdminView: React.FC<AdminViewProps> = ({ view, setView, toast }) => {
  const { user, hasPermission } = useAuthStore();
  const allowedNav = useMemo(() => {
    if (user?.role === 'ADMIN') {
      return [...nav, { id: 'staff' as AdminViewType, label: 'Staff Management', icon: <Users size={17} /> }];
    }
    if (user?.role === 'STAFF') {
      return nav.filter(item => {
        const permMap: Record<string, string> = {
          'overview': 'overview.view',
          'products': 'products.view',
          'orders': 'orders.view',
          'customers': 'customers.view',
          'lens': 'inventory.view',
          'analytics': 'analytics.view',
          'suppliers': 'suppliers.view',
          'reports': 'reports.view'
        };
        return hasPermission(permMap[item.id] || 'unknown');
      });
    }
    return [];
  }, [user, hasPermission]);

  return <div className="min-h-screen bg-base-200 flex"><aside className="hidden lg:flex w-64 flex-col bg-base-100 border-r border-base-300 p-4 sticky top-0 h-screen"><div className="px-3 py-3 mb-5"><div className="font-black text-xl">nayan<span className="text-primary">.</span></div><p className="text-[10px] uppercase tracking-[.2em] text-base-content/50">Optical studio console</p></div><p className="text-[10px] uppercase tracking-[.18em] text-base-content/40 px-3 mb-2">Workspace</p><ul className="menu p-0 gap-1">{allowedNav.map((item) => <li key={item.id}><button className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>{item.icon}{item.label}{item.id === 'lens' && <span className="badge badge-warning badge-xs ml-auto">3</span>}</button></li>)}</ul><div className="mt-auto card bg-primary text-primary-content"><div className="card-body p-4"><p className="text-xs opacity-75">Monday, 17 Jun</p><p className="font-semibold">Store health</p><progress className="progress progress-secondary mt-2" value={82} max={100} /><p className="text-xs opacity-75">82% on track</p><button className="btn btn-sm btn-ghost mt-2" onClick={() => useAuthStore.getState().logout()}>Logout</button></div></div></aside><main className="flex-1 min-w-0"><div className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-20 px-4 md:px-8"><div className="flex-1"><div className="lg:hidden font-black text-xl mr-4">nayan<span className="text-primary">.</span></div><label className="input input-bordered input-sm flex items-center gap-2 max-w-sm w-full"><Search size={15} className="opacity-60" /><input className="grow" placeholder="Search console…" /></label></div><button className="btn btn-ghost btn-circle btn-sm" onClick={() => toast('You are all caught up — no new alerts', 'info')}><Bell size={17} /></button><button className="btn btn-ghost btn-circle btn-sm" onClick={() => toast('Console settings are already up to date', 'info')}><Settings2 size={17} /></button><div className="avatar placeholder ml-2"><div className="bg-secondary text-secondary-content rounded-full w-8"><span className="text-xs">{user?.name?.charAt(0).toUpperCase() || 'A'}</span></div></div></div><div className="lg:hidden tabs tabs-boxed rounded-none bg-base-100 border-b border-base-300 px-3 overflow-x-auto">{allowedNav.map((item) => <button key={item.id} className={`tab whitespace-nowrap ${view === item.id ? 'tab-active' : ''}`} onClick={() => setView(item.id)}>{item.label}</button>)}</div><div className="p-4 md:p-8 max-w-7xl">{view === 'overview' && <Overview setView={setView} toast={toast} />}{view === 'products' && <ProductsAdmin toast={toast} />}{view === 'orders' && <OrdersAdmin toast={toast} />}{view === 'customers' && <CustomersAdmin />}{view === 'lens' && <LensAdmin toast={toast} />}{view === 'analytics' && <Analytics />}{view === 'suppliers' && <Suppliers toast={toast} />}{view === 'reports' && <Reports toast={toast} />}{view === 'staff' && <StaffAdmin toast={toast} />}</div></main></div>;
};

const AdminHeading: React.FC<{ eyebrow: string; title: string; action?: React.ReactNode }> = ({ eyebrow, title, action }) => <div className="flex flex-wrap items-end justify-between gap-3 mb-6"><div><p className="text-xs uppercase tracking-[.2em] text-primary font-semibold">{eyebrow}</p><h1 className="text-3xl font-black mt-1">{title}</h1></div>{action}</div>;
const toneClasses: Record<string, string> = { primary: 'bg-primary/15 text-primary', secondary: 'bg-secondary/15 text-secondary', accent: 'bg-accent/15 text-accent', info: 'bg-info/15 text-info', warning: 'bg-warning/15 text-warning', error: 'bg-error/15 text-error' };
const Kpi: React.FC<{ label: string; value: string; delta: string; icon: React.ReactNode; tone?: string }> = ({ label, value, delta, icon, tone = 'primary' }) => <div className="card bg-base-100 border border-base-300"><div className="card-body p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-base-content/60">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div><div className={`p-2.5 rounded-xl ${toneClasses[tone] ?? toneClasses.primary}`}>{icon}</div></div><p className="text-xs text-success mt-4">↗ {delta} <span className="text-base-content/50">vs last week</span></p></div></div>;

const Overview: React.FC<Pick<AdminViewProps, 'setView' | 'toast'>> = ({ setView, toast }) => { const { user } = useAuthStore(); return <><AdminHeading eyebrow="Monday, 17 June 2024" title={`Good morning, ${user?.name || 'User'}`} action={<button className="btn btn-primary" onClick={() => toast('Report exported as CSV', 'success')}><Download size={16} /> Export report</button>} /><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"><Kpi label="Gross sales" value="₹1,84,920" delta="18.6%" icon={<BarChart3 />} /><Kpi label="Orders" value="128" delta="12.4%" icon={<ShoppingCart />} tone="secondary" /><Kpi label="New customers" value="64" delta="8.9%" icon={<Users />} tone="accent" /><Kpi label="Avg. order value" value="₹1,445" delta="4.2%" icon={<Store />} tone="info" /></div><div className="grid xl:grid-cols-[1.45fr_1fr] gap-4 mt-4"><div className="card bg-base-100 border border-base-300"><div className="card-body"><div className="flex justify-between items-center"><div><h2 className="font-bold text-lg">Sales overview</h2><p className="text-xs text-base-content/60">Last 30 days · All channels</p></div><select className="select select-bordered select-sm"><option>Last 30 days</option><option>Last 7 days</option></select></div><div className="chart-bars mt-6">{[48, 62, 54, 74, 66, 82, 58, 76, 88, 72, 94, 80, 96, 86, 100].map((height, i) => <div className="chart-bar-wrap" key={i}><div className="chart-bar" style={{ height: `${height}%` }} /><span>{i % 3 === 0 ? `Jun ${i + 1}` : ''}</span></div>)}</div><div className="flex gap-5 text-xs text-base-content/60 mt-4"><span><i className="legend-dot bg-primary" /> Frames</span><span><i className="legend-dot bg-secondary" /> Lenses</span></div></div></div><div className="card bg-base-100 border border-base-300"><div className="card-body"><div className="flex justify-between"><div><h2 className="font-bold text-lg">Low stock alerts</h2><p className="text-xs text-base-content/60">Needs your attention</p></div><button className="btn btn-ghost btn-sm" onClick={() => setView('lens')}>View all <ChevronRight size={14} /></button></div><div className="space-y-3 mt-5"><StockAlert name="1.60 Blue-cut · Medium" level="12 units left" tone="warning" /><StockAlert name="Photochromic Brown · 1.56" level="7 units left" tone="error" /><StockAlert name="Kids Flex Temple · Small" level="9 units left" tone="warning" /></div></div></div></div><div className="card bg-base-100 border border-base-300 mt-4"><div className="card-body"><div className="flex justify-between items-center mb-3"><div><h2 className="font-bold text-lg">Recent orders</h2><p className="text-xs text-base-content/60">Live order queue</p></div><button className="btn btn-ghost btn-sm" onClick={() => setView('orders')}>All orders <ChevronRight size={14} /></button></div><OrderTable compact onSelect={() => setView('orders')} /></div></div></>; };
const StockAlert: React.FC<{ name: string; level: string; tone: string }> = ({ name, level, tone }) => <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${toneClasses[tone] ?? toneClasses.warning}`}><AlertTriangle size={16} /></div><div className="flex-1"><p className="text-sm font-medium">{name}</p><p className="text-xs text-base-content/60">{level}</p></div><button className="btn btn-outline btn-xs">Reorder</button></div>;

const ProductsAdmin: React.FC<Pick<AdminViewProps, 'toast'>> = ({ toast }) => {
  const { frames, fetchFrames, deleteFrame } = useProductStore();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchFrames({ search, category, limit: 50, includeInactive: true });
    }, 300);
    return () => clearTimeout(delay);
  }, [search, category, fetchFrames]);

  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.edit');
  const canDelete = hasPermission('products.delete');

  return (
    <>
      <AdminHeading 
        eyebrow="Catalog" 
        title="Products" 
        action={
          canCreate ? (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={17} /> Add product
            </button>
          ) : null
        } 
      />
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-2 justify-between">
            <label className="input input-bordered input-sm flex items-center gap-2 w-72">
              <Search size={15} className="opacity-60" />
              <input 
                className="grow" 
                placeholder="Search products…" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </label>
            <div className="flex gap-2">
              <select 
                className="select select-bordered select-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>All categories</option>
                <option>Eyeglasses</option>
                <option>Sunglasses</option>
                <option>Blue-light</option>
                <option>Kids</option>
                <option>Premium</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => toast('Exporting products as CSV...', 'info')}>
                <Download size={15} /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {frames.map((p) => (
                  <tr key={p.id} className={p.status === 'INACTIVE' ? 'opacity-50' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg bg-base-200">
                          <div className="scale-[.55] origin-top-left">
                            <ProductMini product={p} />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-base-content/50">{p.code || p.id} · {p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{p.category}</td>
                    <td className="font-semibold">₹{p.price.toLocaleString('en-IN')}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`badge badge-sm ${
                        p.status === 'OUT_OF_STOCK' ? 'badge-error' 
                        : p.status === 'LOW_STOCK' ? 'badge-warning' 
                        : p.status === 'INACTIVE' ? 'badge-ghost' 
                        : 'badge-success'
                      }`}>
                        {p.status === 'OUT_OF_STOCK' ? 'Out of stock' 
                         : p.status === 'LOW_STOCK' ? 'Low stock' 
                         : p.status === 'INACTIVE' ? 'Inactive' 
                         : 'In stock'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {canEdit && (
                          <button className="btn btn-ghost btn-xs" onClick={() => setEditingProduct(p)} title="Edit">
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && p.status !== 'INACTIVE' && (
                          <button className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content" onClick={async () => {
                            if (window.confirm(`Are you sure you want to deactivate ${p.name}?`)) {
                              await deleteFrame(p.id);
                              toast(`${p.name} deactivated`, 'success');
                            }
                          }} title="Deactivate">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {frames.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-base-content/60">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {(showAdd || editingProduct) && (
        <AddProduct 
          product={editingProduct}
          onClose={() => { setShowAdd(false); setEditingProduct(null); }} 
          toast={toast}
        />
      )}
    </>
  );
};
const ProductMini: React.FC<{ product: Product }> = ({ product }) => {
  if (product.images && product.images.length > 0) {
    // Return the actual image using Cloudinary URL
    return (
      <img 
        src={product.images[0].url} 
        alt={product.name || 'Product'} 
        className="w-[87px] h-full object-cover rounded" 
      />
    );
  }
  // Fallback CSS representation
  return (
    <div className="frame-visual frame-visual-compact">
      <span className="lens left" />
      <span className="bridge" />
      <span className="lens right" />
    </div>
  );
};
const AddProduct: React.FC<{ product?: Product | null; onClose: () => void; toast: (m: string, t?: 'success'|'error') => void }> = ({ product, onClose, toast }) => {
  const { createFrame, updateFrame } = useProductStore();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    code: product?.code || product?.id || '',
    brand: product?.brand || 'Nayan House',
    category: product?.category || 'Eyeglasses',
    price: product?.price || '',
    mrp: product?.mrp || '',
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || 10,
    shape: product?.shape || 'Round',
    size: product?.size || 'Medium',
    colors: product?.colors?.join(', ') || '',
    lens: product?.lens?.join(', ') || '',
  });

  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{url: string, publicId: string}[]>(product?.images || []);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      newImages.forEach(file => {
        if ((file as any).preview) URL.revokeObjectURL((file as any).preview);
      });
    };
  }, [newImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Validate count
    if (existingImages.length + newImages.length + files.length > 5) {
      toast('Maximum 5 images allowed per product', 'error');
      return;
    }

    const validFiles = files.filter(file => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast(`Invalid file type: ${file.name}. Only JPEG, PNG, WEBP allowed.`, 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast(`File too large: ${file.name}. Max 5MB allowed.`, 'error');
        return false;
      }
      (file as any).preview = URL.createObjectURL(file);
      return true;
    });

    setNewImages(prev => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    const file = newImages[index];
    if ((file as any).preview) URL.revokeObjectURL((file as any).preview);
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (publicId: string) => {
    setExistingImages(prev => prev.filter(img => img.publicId !== publicId));
    setImagesToRemove(prev => [...prev, publicId]);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.price || !formData.category) {
      toast('Name, Code, Category, and Price are required', 'error');
      return;
    }
    
    setIsUploading(true);

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('code', formData.code);
    payload.append('brand', formData.brand);
    payload.append('category', formData.category);
    payload.append('price', String(formData.price));
    payload.append('mrp', String(Number(formData.mrp) || Number(formData.price)));
    payload.append('stock', String(formData.stock));
    payload.append('lowStockThreshold', String(formData.lowStockThreshold));
    payload.append('shape', formData.shape);
    payload.append('size', formData.size);
    
    const colorsArr = formData.colors.split(',').map(s => s.trim()).filter(Boolean);
    colorsArr.forEach(c => payload.append('colors', c));
    
    const lensArr = formData.lens.split(',').map(s => s.trim()).filter(Boolean);
    lensArr.forEach(l => payload.append('lens', l));

    if (imagesToRemove.length > 0) {
      payload.append('imagesToRemove', JSON.stringify(imagesToRemove));
    }

    newImages.forEach(file => {
      payload.append('images', file);
    });

    try {
      if (product) {
        await updateFrame(product.id, payload);
        toast('Product updated successfully', 'success');
      } else {
        await createFrame(payload);
        toast('Product added successfully', 'success');
      }
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save product';
      toast(errMsg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose} disabled={isUploading}><X size={16} /></button>
        <h3 className="font-bold text-xl">{product ? 'Edit product' : 'Add product'}</h3>
        <p className="text-sm text-base-content/60 mt-1">Manage product catalog details.</p>
        
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <label className="form-control"><span className="label-text text-sm">Product name *</span>
            <input className="input input-bordered" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Anika Soft Square" disabled={isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">Product code *</span>
            <input className="input input-bordered" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="NO-111" disabled={!!product || isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">Brand</span>
            <input className="input input-bordered" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Nayan House" disabled={isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">Category *</span>
            <select className="select select-bordered" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} disabled={isUploading}>
              <option>Eyeglasses</option>
              <option>Sunglasses</option>
              <option>Blue-light</option>
              <option>Kids</option>
              <option>Premium</option>
            </select>
          </label>
          <label className="form-control"><span className="label-text text-sm">Price (₹) *</span>
            <input className="input input-bordered" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="1999" disabled={isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">MRP (₹)</span>
            <input className="input input-bordered" type="number" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} placeholder="2499" disabled={isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">Stock Quantity</span>
            <input className="input input-bordered" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" disabled={isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">Low Stock Threshold</span>
            <input className="input input-bordered" type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} placeholder="10" disabled={isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">Shape</span>
            <input className="input input-bordered" value={formData.shape} onChange={e => setFormData({...formData, shape: e.target.value})} placeholder="Round" disabled={isUploading} />
          </label>
          <label className="form-control"><span className="label-text text-sm">Colors (comma separated)</span>
            <input className="input input-bordered" value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} placeholder="Black, Tortoise" disabled={isUploading} />
          </label>
        </div>

        <div className="mt-6 border-t border-base-300 pt-4">
          <p className="font-semibold text-sm mb-2">Product Images (Max 5)</p>
          <div className="flex flex-wrap gap-4 items-start">
            {/* Existing Images */}
            {existingImages.map((img) => (
              <div key={img.publicId} className="relative w-24 h-24 rounded-xl border border-base-300 bg-base-200 overflow-hidden flex items-center justify-center">
                <img src={img.url} alt="Product" className="w-full h-full object-cover" />
                <button 
                  className="btn btn-xs btn-circle btn-error absolute top-1 right-1 opacity-80 hover:opacity-100" 
                  onClick={() => removeExistingImage(img.publicId)}
                  disabled={isUploading}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {/* New Image Previews */}
            {newImages.map((file, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-xl border border-base-300 bg-base-200 overflow-hidden flex items-center justify-center">
                <img src={(file as any).preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  className="btn btn-xs btn-circle btn-error absolute top-1 right-1 opacity-80 hover:opacity-100" 
                  onClick={() => removeNewImage(idx)}
                  disabled={isUploading}
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            {existingImages.length + newImages.length < 5 && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-base-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-base-100">
                <Plus size={24} className="text-base-content/40 mb-1" />
                <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider">Add</span>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        </div>
        
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={isUploading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isUploading}>
            {isUploading ? <span className="loading loading-spinner loading-sm"></span> : <Check size={16} />} 
            {isUploading ? 'Uploading & Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={!isUploading ? onClose : undefined} />
    </div>
  );
};

const OrdersAdmin: React.FC<Pick<AdminViewProps, 'toast'>> = ({ toast }) => {
  const { orders: storeOrders, counts, fetchOrders } = useOrderStore();
  const [activeTab, setActiveTab] = useState('All orders');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let statusTab = undefined;
    if (activeTab === 'Processing') statusTab = 'Processing';
    if (activeTab === 'Ready') statusTab = 'Ready';
    if (activeTab === 'Returns') statusTab = 'Returns';
    
    const delay = setTimeout(() => {
      fetchOrders({ search, tab: statusTab, limit: 50 });
    }, 300);
    return () => clearTimeout(delay);
  }, [activeTab, search, fetchOrders]);

  const tabs = [
    { label: 'All orders', value: counts.all },
    { label: 'Processing', value: counts.toFulfil },
    { label: 'Ready', value: counts.ready },
    { label: 'Returns', value: counts.returns }
  ];

  return (
    <>
      <AdminHeading eyebrow="Fulfilment" title="Orders" action={<button className="btn btn-outline" onClick={() => toast('Order list exported', 'success')}><Download size={16} /> Export</button>} />
      <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full mb-5">
        <div className="stat"><div className="stat-title">To fulfil</div><div className="stat-value text-primary">{counts.toFulfil}</div><div className="stat-desc">Processing required</div></div>
        <div className="stat"><div className="stat-title">Ready to ship</div><div className="stat-value">{counts.ready}</div><div className="stat-desc">Packed & ready</div></div>
        <div className="stat"><div className="stat-title">Returns pending</div><div className="stat-value">{counts.returns}</div><div className="stat-desc">Review needed</div></div>
      </div>
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
            <div className="tabs tabs-bordered">
              {tabs.map(t => <button key={t.label} className={`tab ${activeTab === t.label ? 'tab-active font-semibold' : ''}`} onClick={() => setActiveTab(t.label)}>{t.label} ({t.value})</button>)}
            </div>
            <label className="input input-bordered input-sm flex items-center gap-2 max-w-xs w-full">
              <Search size={15} className="opacity-60" />
              <input className="grow" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
            </label>
          </div>
          <OrderTable toast={toast} orders={storeOrders} onSelect={setSelectedOrderId} />
        </div>
      </div>
      {selectedOrderId && <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} toast={toast} />}
    </>
  );
};
const statusClass = (status: string) => 
  ['DELIVERED'].includes(status) ? 'badge-success' : 
  ['PROCESSING'].includes(status) ? 'badge-info' : 
  ['PACKED', 'READY_FOR_PICKUP'].includes(status) ? 'badge-warning' : 
  ['RETURN_REQUESTED', 'RETURN_APPROVED', 'REFUND_PENDING'].includes(status) ? 'badge-error' :
  'badge-secondary';

const OrderTable: React.FC<{ compact?: boolean; toast?: AdminViewProps['toast']; orders?: any[]; onSelect?: (id: string) => void }> = ({ compact, toast, orders = [], onSelect }) => {
  const { updateOrderStatus, fetchOrders } = useOrderStore();
  const { hasPermission, user } = useAuthStore();
  const canUpdate = user?.role === 'ADMIN' || hasPermission('orders.update_status');
  
  const displayOrders = compact ? orders.slice(0, 4) : orders;

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {displayOrders.map((order) => {
            const itemCount = order.items?.length || 0;
            return (
              <tr key={order._id}>
                <td className="font-semibold">
                  {order.orderNumber}
                  <p className="font-normal text-xs text-base-content/50">
                    {itemCount} item{itemCount > 1 ? 's' : ''}
                  </p>
                </td>
                <td>{order.customerName}</td>
                <td className="text-sm text-base-content/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>₹{(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td>
                  {canUpdate ? (
                    <select 
                      className={`select select-xs select-bordered bg-transparent ${statusClass(order.orderStatus)}`}
                      value={order.orderStatus}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (window.confirm(`Change status to ${newStatus}?`)) {
                          try {
                            await updateOrderStatus(order._id, newStatus);
                            toast?.(`Status updated to ${newStatus}`, 'success');
                            fetchOrders();
                          } catch (err: any) {
                            toast?.(err.response?.data?.message || 'Failed to update', 'error');
                          }
                        }
                      }}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="PACKED">Packed</option>
                      <option value="READY_FOR_PICKUP">Ready for pickup</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="RETURN_REQUESTED">Return Requested</option>
                    </select>
                  ) : (
                    <span className={`badge ${statusClass(order.orderStatus)} badge-sm`}>{order.orderStatus}</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-ghost btn-xs" onClick={() => onSelect?.(order._id)}>
                    <ChevronRight size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
          {displayOrders.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-6 text-base-content/50">No orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const OrderDetailsModal: React.FC<{ orderId: string; onClose: () => void; toast: AdminViewProps['toast'] }> = ({ orderId, onClose, toast }) => {
  const { activeOrder, fetchOrder, isLoading, updateOrderStatus, fetchOrders } = useOrderStore();
  const { hasPermission, user } = useAuthStore();
  
  useEffect(() => {
    fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  if (isLoading || !activeOrder || activeOrder._id !== orderId) {
    return <div className="modal modal-open"><div className="modal-box text-center py-10"><span className="loading loading-spinner loading-md"></span></div></div>;
  }

  const canUpdate = user?.role === 'ADMIN' || hasPermission('orders.update_status');

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose}><X size={16} /></button>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-2xl">Order {activeOrder.orderNumber}</h3>
            <p className="text-sm text-base-content/60 mt-1">{new Date(activeOrder.createdAt).toLocaleString()}</p>
          </div>
          {canUpdate ? (
            <select 
              className={`select select-sm select-bordered ${statusClass(activeOrder.orderStatus)} mr-6`}
              value={activeOrder.orderStatus}
              onChange={async (e) => {
                const newStatus = e.target.value;
                if (window.confirm(`Change status to ${newStatus}?`)) {
                  try {
                    await updateOrderStatus(activeOrder._id, newStatus);
                    toast?.(`Status updated to ${newStatus}`, 'success');
                    fetchOrders();
                  } catch (err: any) {
                    toast?.(err.response?.data?.message || 'Failed to update', 'error');
                  }
                }
              }}
            >
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PACKED">Packed</option>
              <option value="READY_FOR_PICKUP">Ready for pickup</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURN_REQUESTED">Return Requested</option>
            </select>
          ) : (
            <span className={`badge ${statusClass(activeOrder.orderStatus)} mr-6 mt-1`}>{activeOrder.orderStatus}</span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6 border-b border-base-300 pb-6">
          <div>
            <p className="font-bold text-sm uppercase tracking-wider text-base-content/60 mb-2">Customer</p>
            <p className="font-semibold">{activeOrder.customer?.name || activeOrder.customerName}</p>
            <p className="text-sm text-base-content/80 mt-1">{activeOrder.customer?.email || activeOrder.customerEmail}</p>
            <p className="text-sm text-base-content/80">{activeOrder.customer?.mobile || activeOrder.customerMobile}</p>
          </div>
          <div>
            <p className="font-bold text-sm uppercase tracking-wider text-base-content/60 mb-2">Delivery Address</p>
            <p className="font-semibold">{activeOrder.shippingAddress?.name || activeOrder.customerName}</p>
            <p className="text-sm text-base-content/80 mt-1">{activeOrder.shippingAddress?.street}</p>
            <p className="text-sm text-base-content/80">{activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.state} {activeOrder.shippingAddress?.zipCode}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="font-bold text-sm uppercase tracking-wider text-base-content/60 mb-4">Ordered Items</p>
          <div className="space-y-4">
            {activeOrder.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="w-16 h-12 bg-base-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="scale-[.4] origin-top-left absolute left-2 top-2"><ProductMini product={{ id: '', name: '', brand: '', price: 0, tag: '', lens: [], mrp: 0, shape: '', size: '', code: '', category: '', stock: 0, status: 'INACTIVE', colors: [] }} /></div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.productName}</p>
                  <p className="text-xs text-base-content/60">ID: {item.productNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{item.price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-base-content/60">Qty: {item.quantity}</p>
                </div>
                <div className="text-right w-24">
                  <p className="font-bold">₹{item.total.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6 border-t border-base-300 pt-4">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{(activeOrder.subtotal || 0).toLocaleString('en-IN')}</span></div>
            {activeOrder.discount > 0 && <div className="flex justify-between text-success"><span>Welcome saving</span><span>-₹{activeOrder.discount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between"><span>Tax</span><span>₹{(activeOrder.tax || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{(activeOrder.shipping || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between font-black text-lg border-t border-base-300 pt-2"><span>Total</span><span>₹{(activeOrder.totalAmount || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between pt-1"><span className="text-base-content/60">Payment</span><span className="badge badge-sm badge-success">{activeOrder.paymentStatus}</span></div>
          </div>
        </div>

        <div className="mt-8 bg-base-200 rounded-xl p-5">
          <p className="font-bold text-sm uppercase tracking-wider text-base-content/60 mb-4">Timeline</p>
          <ul className="steps steps-vertical w-full">
            {activeOrder.timeline?.map((evt: any, i: number) => (
              <li key={i} className="step step-primary text-sm text-left w-full justify-start">
                <div className="ml-2 py-1">
                  <span className="font-semibold block">{evt.status}</span>
                  <span className="text-xs text-base-content/60">{new Date(evt.timestamp || activeOrder.createdAt).toLocaleString()}</span>
                </div>
              </li>
            ))}
            {!['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(activeOrder.orderStatus) && (
              <li className="step text-sm text-left w-full justify-start opacity-40">
                <div className="ml-2 py-1"><span className="font-semibold block">Expected Delivery</span></div>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

const CustomerDetailDrawer = ({ id, onClose }: { id: string, onClose: () => void }) => {
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const [tab, setTab] = useState('PROFILE');

  // Record payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Rx form state
  const [showRxForm, setShowRxForm] = useState(false);
  const [editingRxId, setEditingRxId] = useState<string | null>(null);
  const [rxForm, setRxForm] = useState({
    od: { sph: '', cyl: '', axis: '' },
    os: { sph: '', cyl: '', axis: '' },
    pd: '', add: '', notes: ''
  });
  const [savingRx, setSavingRx] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get(`http://localhost:5000/api/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`http://localhost:5000/api/customers/${id}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`http://localhost:5000/api/customers/${id}/prescriptions`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`http://localhost:5000/api/customers/${id}/activity`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`http://localhost:5000/api/customers/${id}/payments`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([resC, resO, resP, resA, resPay]) => {
      setCustomer(resC.data);
      setOrders(resO.data);
      setPrescriptions(resP.data);
      setActivity(resA.data);
      setPayments(resPay.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const handleSaveRx = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRx(true);
    try {
      if (editingRxId) {
        await axios.put(`http://localhost:5000/api/customers/${id}/prescriptions/${editingRxId}`, rxForm, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`http://localhost:5000/api/customers/${id}/prescriptions`, rxForm, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowRxForm(false);
      setEditingRxId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save prescription');
    } finally {
      setSavingRx(false);
    }
  };

  const openEditRx = (rx: any) => {
    setEditingRxId(rx._id);
    setRxForm({
      od: { sph: rx.od?.sph || '', cyl: rx.od?.cyl || '', axis: rx.od?.axis || '' },
      os: { sph: rx.os?.sph || '', cyl: rx.os?.cyl || '', axis: rx.os?.axis || '' },
      pd: rx.pd || '', add: rx.add || '', notes: rx.notes || ''
    });
    setShowRxForm(true);
  };
  
  const openNewRx = () => {
    setEditingRxId(null);
    setRxForm({
      od: { sph: '', cyl: '', axis: '' },
      os: { sph: '', cyl: '', axis: '' },
      pd: '', add: '', notes: ''
    });
    setShowRxForm(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || isNaN(Number(payAmount))) return;
    setRecordingPayment(true);
    try {
      await axios.post(`http://localhost:5000/api/customers/${id}/payments`, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: payNotes,
        type: 'PAYMENT'
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowPaymentForm(false);
      setPayAmount('');
      setPayNotes('');
      fetchData(); // Refresh all data to update balance and ledger
    } catch (err) {
      console.error(err);
      alert('Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const totalOrders = orders.length;
  const lifetimeValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(lifetimeValue / totalOrders) : 0;
  const pendingOrders = orders.filter(o => ['PENDING', 'PROCESSING', 'PACKED'].includes(o.orderStatus)).length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'DELIVERED').length;
  
  const totalPaid = payments.filter(p => p.type === 'PAYMENT' || p.type === 'PURCHASE').reduce((sum, p) => p.type === 'PAYMENT' ? sum + p.amount : sum + (p.amountPaid || 0), 0);
  const totalRefunds = payments.filter(p => p.type === 'REFUND').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-base-100 h-[90vh] rounded-2xl shadow-xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-100 rounded-t-2xl sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-lg">{customer?.name || 'Customer Details'}</h2>
            <p className="text-xs text-base-content/60">{customer?._id}</p>
          </div>
          <button className="btn btn-ghost btn-circle btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>
          ) : !customer ? (
            <div className="text-center p-8 text-error">Failed to load customer</div>
          ) : (
            <div className="space-y-6">
              <div className="tabs tabs-boxed">
                <button className={`tab ${tab==='PROFILE'?'tab-active':''}`} onClick={()=>setTab('PROFILE')}>Profile</button>
                <button className={`tab ${tab==='ORDERS'?'tab-active':''}`} onClick={()=>setTab('ORDERS')}>Orders</button>
                <button className={`tab ${tab==='PRESCRIPTION'?'tab-active':''}`} onClick={()=>setTab('PRESCRIPTION')}>Rx</button>
                <button className={`tab ${tab==='PAYMENTS'?'tab-active':''}`} onClick={()=>setTab('PAYMENTS')}>Payments</button>
                <button className={`tab ${tab==='ACTIVITY'?'tab-active':''}`} onClick={()=>setTab('ACTIVITY')}>Activity</button>
              </div>

              {tab === 'PROFILE' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-base-200 p-4 rounded-xl overflow-hidden">
                      <p className="text-xs text-base-content/60">Contact</p>
                      <p className="font-medium mt-1 truncate" title={customer.email}>{customer.email}</p>
                      <p className="font-medium truncate">{customer.mobileNumber || '—'}</p>
                    </div>
                    <div className={`p-4 rounded-xl overflow-hidden border-2 ${customer.outstandingBalance > 0 ? 'border-error/30 bg-error/5' : 'bg-base-200 border-transparent'}`}>
                      <p className="text-xs text-base-content/60">Outstanding Balance</p>
                      <p className={`text-2xl font-bold mt-1 ${customer.outstandingBalance > 0 ? 'text-error' : 'text-success'}`}>
                        {customer.outstandingBalance > 0 ? `₹${customer.outstandingBalance.toLocaleString('en-IN')}` : 'No outstanding balance'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-base-200 p-4 rounded-xl">
                    <p className="text-xs text-base-content/60 mb-2">Lifetime Value summary</p>
                    <div className="grid grid-cols-2 gap-y-2">
                      <span className="text-sm">Total orders:</span><span className="text-sm font-medium">{totalOrders}</span>
                      <span className="text-sm">Lifetime spend:</span><span className="text-sm font-medium">₹{lifetimeValue.toLocaleString('en-IN')}</span>
                      <span className="text-sm">Avg order value:</span><span className="text-sm font-medium">₹{avgOrderValue.toLocaleString('en-IN')}</span>
                      <span className="text-sm">Pending:</span><span className="text-sm font-medium">{pendingOrders}</span>
                      <span className="text-sm">Delivered:</span><span className="text-sm font-medium">{deliveredOrders}</span>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'ORDERS' && (
                <div className="space-y-3">
                  {orders.length === 0 ? <p className="text-center text-sm text-base-content/60 py-4">No orders found.</p> : 
                    orders.map(o => (
                      <div key={o._id} className="card bg-base-200 border border-base-300">
                        <div className="card-body p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm">{o.orderNumber}</span>
                            <span className="badge badge-sm badge-outline">{o.orderStatus}</span>
                          </div>
                          <p className="text-xs text-base-content/60">{new Date(o.createdAt).toLocaleDateString()} · ₹{o.totalAmount.toLocaleString('en-IN')}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs">Payment: <span className={o.outstanding > 0 ? 'text-error font-medium' : 'text-success font-medium'}>{o.paymentStatus}</span></span>
                            {o.outstanding > 0 && <span className="text-xs text-error">Due: ₹{o.outstanding.toLocaleString('en-IN')}</span>}
                          </div>
                          <div className="text-xs mt-2 truncate">
                            {o.items.map((i:any) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {tab === 'PRESCRIPTION' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Prescriptions</h3>
                    <button className="btn btn-sm btn-primary" onClick={() => showRxForm ? setShowRxForm(false) : openNewRx()}>
                      {showRxForm ? 'Cancel' : 'Add Prescription'}
                    </button>
                  </div>
                  
                  {showRxForm && (
                    <form onSubmit={handleSaveRx} className="bg-base-200 p-4 rounded-xl space-y-3 border border-primary/30">
                      <div className="text-sm font-semibold mb-2">{editingRxId ? 'Edit Prescription' : 'New Prescription'}</div>
                      <table className="table table-xs w-full">
                        <thead>
                          <tr>
                            <th></th><th>SPH</th><th>CYL</th><th>AXIS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <th>OD (R)</th>
                            <td><input className="input input-bordered input-xs w-full" value={rxForm.od.sph} onChange={e => setRxForm({...rxForm, od: {...rxForm.od, sph: e.target.value}})} /></td>
                            <td><input className="input input-bordered input-xs w-full" value={rxForm.od.cyl} onChange={e => setRxForm({...rxForm, od: {...rxForm.od, cyl: e.target.value}})} /></td>
                            <td><input className="input input-bordered input-xs w-full" value={rxForm.od.axis} onChange={e => setRxForm({...rxForm, od: {...rxForm.od, axis: e.target.value}})} /></td>
                          </tr>
                          <tr>
                            <th>OS (L)</th>
                            <td><input className="input input-bordered input-xs w-full" value={rxForm.os.sph} onChange={e => setRxForm({...rxForm, os: {...rxForm.os, sph: e.target.value}})} /></td>
                            <td><input className="input input-bordered input-xs w-full" value={rxForm.os.cyl} onChange={e => setRxForm({...rxForm, os: {...rxForm.os, cyl: e.target.value}})} /></td>
                            <td><input className="input input-bordered input-xs w-full" value={rxForm.os.axis} onChange={e => setRxForm({...rxForm, os: {...rxForm.os, axis: e.target.value}})} /></td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                         <div className="form-control">
                            <label className="label text-xs py-1">PD</label>
                            <input className="input input-bordered input-sm" value={rxForm.pd} onChange={e => setRxForm({...rxForm, pd: e.target.value})} />
                         </div>
                         <div className="form-control">
                            <label className="label text-xs py-1">ADD</label>
                            <input className="input input-bordered input-sm" value={rxForm.add} onChange={e => setRxForm({...rxForm, add: e.target.value})} />
                         </div>
                      </div>
                      <div className="form-control">
                        <label className="label text-xs py-1">Notes</label>
                        <input className="input input-bordered input-sm" value={rxForm.notes} onChange={e => setRxForm({...rxForm, notes: e.target.value})} />
                      </div>
                      <div className="flex justify-end mt-4">
                        <button type="submit" className="btn btn-sm btn-primary" disabled={savingRx}>
                          {savingRx ? 'Saving...' : 'Save Prescription'}
                        </button>
                      </div>
                    </form>
                  )}

                  {!showRxForm && prescriptions.length === 0 ? <p className="text-center text-sm text-base-content/60 py-4">No prescription saved.</p> : 
                    !showRxForm && prescriptions.map((p, idx) => (
                      <div key={p._id} className="card bg-base-200 border border-base-300 relative group">
                        <button className="btn btn-xs btn-outline absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-base-100" onClick={() => openEditRx(p)}>Edit</button>
                        <div className="card-body p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-sm mr-8">{idx === 0 ? 'Current Prescription' : 'Previous Prescription'}</span>
                            <span className="text-xs text-base-content/60">{new Date(p.date).toLocaleDateString()}</span>
                          </div>
                          <table className="table table-xs">
                            <thead>
                              <tr>
                                <th></th>
                                <th>SPH</th>
                                <th>CYL</th>
                                <th>AXIS</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <th>OD (Right)</th>
                                <td>{p.od?.sph || '—'}</td>
                                <td>{p.od?.cyl || '—'}</td>
                                <td>{p.od?.axis || '—'}</td>
                              </tr>
                              <tr>
                                <th>OS (Left)</th>
                                <td>{p.os?.sph || '—'}</td>
                                <td>{p.os?.cyl || '—'}</td>
                                <td>{p.os?.axis || '—'}</td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="flex gap-4 mt-2 px-2">
                            <div className="text-xs"><span className="text-base-content/60 mr-1">PD:</span>{p.pd || '—'}</div>
                            <div className="text-xs"><span className="text-base-content/60 mr-1">ADD:</span>{p.add || '—'}</div>
                          </div>
                          {p.notes && <div className="text-xs mt-3 px-2 bg-base-100 p-2 rounded-lg italic">"{p.notes}"</div>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {tab === 'PAYMENTS' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Payment History</h3>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                      {showPaymentForm ? 'Cancel' : 'Record Payment'}
                    </button>
                  </div>
                  
                  {showPaymentForm && (
                    <form onSubmit={handleRecordPayment} className="bg-base-200 p-4 rounded-xl space-y-3 border border-primary/30">
                      <div className="text-sm font-semibold mb-2">Record a Payment</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-control">
                          <label className="label text-xs">Amount (₹)</label>
                          <input type="number" className="input input-bordered input-sm" value={payAmount} onChange={e => setPayAmount(e.target.value)} required min="1" />
                        </div>
                        <div className="form-control">
                          <label className="label text-xs">Method</label>
                          <select className="select select-bordered select-sm" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                            <option>Cash</option>
                            <option>UPI</option>
                            <option>Card</option>
                            <option>Bank Transfer</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label text-xs">Notes (Optional)</label>
                        <input type="text" className="input input-bordered input-sm" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="E.g., Cleared partial due" />
                      </div>
                      <div className="flex justify-end mt-4">
                        <button type="submit" className="btn btn-sm btn-primary" disabled={recordingPayment || !payAmount}>
                          {recordingPayment ? 'Saving...' : 'Save Payment'}
                        </button>
                      </div>
                    </form>
                  )}

                  {payments.length === 0 ? <p className="text-center text-sm text-base-content/60 py-4">No payment history.</p> : 
                    <div className="space-y-3">
                      {payments.map(p => (
                        <div key={p._id} className="card bg-base-200 border border-base-300">
                          <div className="card-body p-4 flex flex-row items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">
                                {p.type === 'PURCHASE' ? `Purchase` : p.type === 'PAYMENT' ? 'Payment Received' : p.type}
                              </div>
                              <div className="text-xs text-base-content/60 mt-1">
                                {new Date(p.createdAt).toLocaleDateString()} {p.paymentMethod !== 'Other' && `· ${p.paymentMethod}`}
                              </div>
                              {p.notes && <div className="text-xs mt-1 text-base-content/70">{p.notes}</div>}
                            </div>
                            <div className="text-right">
                              <div className={`font-bold ${p.type === 'PURCHASE' ? '' : 'text-success'}`}>
                                {p.type === 'PURCHASE' ? '' : '+'}₹{p.type === 'PURCHASE' ? p.orderTotal?.toLocaleString('en-IN') : p.amount.toLocaleString('en-IN')}
                              </div>
                              {p.type === 'PURCHASE' && p.amountPaid !== undefined && (
                                <div className="text-xs text-success">Paid: ₹{p.amountPaid.toLocaleString('en-IN')}</div>
                              )}
                              <div className="text-xs text-base-content/50 mt-1">
                                Bal: ₹{p.outstandingAmount.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                </div>
              )}

              {tab === 'ACTIVITY' && (
                <div className="space-y-4">
                  {activity.length === 0 ? <p className="text-center text-sm text-base-content/60 py-4">No activity found.</p> : 
                    <ul className="steps steps-vertical">
                      {activity.map((a, i) => (
                        <li key={i} className={`step ${i===0?'step-primary':''}`}>
                          <div className="text-left ml-2">
                            <p className="text-sm font-medium">{a.description}</p>
                            <p className="text-xs text-base-content/60">{new Date(a.date).toLocaleString()}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomersAdmin: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCustomers: '-', repeatRate: '-', prescriptionsSaved: '-' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { token } = useAuthStore();
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchCustomers = (q = '') => {
    setLoading(true);
    axios.get(`http://localhost:5000/api/customers?search=${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCustomers(res.data.customers))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    axios.get('http://localhost:5000/api/customers/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(console.error);
    fetchCustomers();
  }, [token]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    setDebounceTimeout(setTimeout(() => fetchCustomers(val), 400));
  };

  return (
    <>
      <AdminHeading 
        eyebrow="Relationships" 
        title="Customers" 
        action={
          <label className="input input-bordered flex items-center gap-2 input-sm w-64">
            <Search size={15} className="opacity-60" />
            <input className="grow" placeholder="Search customers…" value={search} onChange={handleSearch} />
          </label>
        } 
      />
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <Kpi label="Total customers" value={stats.totalCustomers as any} delta="vs last week" icon={<Users />} />
        <Kpi label="Repeat rate" value={stats.repeatRate as any} delta="vs last week" icon={<ShoppingCart />} tone="secondary" />
        <Kpi label="Prescriptions saved" value={stats.prescriptionsSaved as any} delta="vs last week" icon={<FileText />} tone="info" />
      </div>
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <h2 className="font-bold">Recent customer activity</h2>
          <div className="overflow-x-auto mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Last order</th>
                  <th>Lifetime value</th>
                  <th>Preference</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="text-center py-8"><span className="loading loading-spinner" /></td></tr> : 
                 customers.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-base-content/60">No customers found</td></tr> :
                 customers.map((c) => (
                  <tr key={c._id} className="hover cursor-pointer" onClick={() => setSelectedId(c._id)}>
                    <td>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-base-content/60">{c.mobileNumber || c.email}</div>
                    </td>
                    <td className="text-sm">{c.lastOrderNumber ? `${c.lastOrderNumber} · ${new Date(c.lastOrderDate).toLocaleDateString()}` : '—'}</td>
                    <td>{c.lifetimeValue ? `₹${c.lifetimeValue.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="text-sm text-base-content/60">{c.preference || '—'}</td>
                    <td><button className="btn btn-ghost btn-xs"><ChevronRight size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedId && <CustomerDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
};

const LensAdmin: React.FC<Pick<AdminViewProps, 'toast'>> = ({ toast }) => { const [ack, setAck] = useState<string[]>([]); const lens = [['1.60 Blue-cut', 'Medium', '12', '20'], ['Photochromic Brown', '1.56', '7', '15'], ['Kids Flex Temple', 'Small', '9', '12'], ['Anti-glare Clear', '1.56', '84', '25'], ['Polarised Grey', 'Sun', '42', '20']]; return <><AdminHeading eyebrow="Inventory" title="Lens stock" action={<button className="btn btn-primary" onClick={() => toast('Reorder request sent to suppliers', 'success')}><Plus size={16} /> Create reorder</button>} /><div className="alert alert-warning mb-5"><AlertTriangle size={18} /><div><p className="font-semibold">3 items need attention</p><p className="text-xs">Acknowledge alerts to keep your queue clean. Acknowledged alerts return when stock changes.</p></div></div><div className="card bg-base-100 border border-base-300"><div className="card-body p-4"><div className="flex justify-between items-center"><div><h2 className="font-bold">Lens inventory</h2><p className="text-xs text-base-content/60">Updated 4 minutes ago</p></div><button className="btn btn-ghost btn-sm"><Download size={15} /> Export</button></div><div className="overflow-x-auto mt-3"><table className="table"><thead><tr><th>Lens / material</th><th>Variant</th><th>On hand</th><th>Threshold</th><th>Health</th><th>Action</th></tr></thead><tbody>{lens.map((row) => { const low = Number(row[2]) < Number(row[3]); const isAck = ack.includes(row[0]); return <tr key={row[0]}><td className="font-semibold">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><span className={`badge badge-sm ${low && !isAck ? 'badge-warning' : 'badge-success'}`}>{low && !isAck ? 'Low stock' : isAck ? 'Acknowledged' : 'Healthy'}</span></td><td>{low && !isAck ? <button className="btn btn-outline btn-xs" onClick={() => { setAck([...ack, row[0]]); toast(`${row[0]} alert acknowledged`, 'info'); }}>Acknowledge</button> : <span className="text-xs text-base-content/50">No action</span>}</td></tr> })}</tbody></table></div></div></div></> };

const Analytics: React.FC = () => { const [period, setPeriod] = useState('7 days'); return <><AdminHeading eyebrow="Discovery" title="Search analytics" action={<select className="select select-bordered select-sm" value={period} onChange={(e) => setPeriod(e.target.value)}><option>7 days</option><option>30 days</option><option>90 days</option></select>} /><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"><Kpi label="Searches" value="12,486" delta="22.8%" icon={<Search />} /><Kpi label="Image searches" value="1,284" delta="36.2%" icon={<Boxes />} tone="secondary" /><Kpi label="Zero-result searches" value="184" delta="9.1%" icon={<AlertTriangle />} tone="warning" /><Kpi label="Search → purchase" value="8.4%" delta="1.8%" icon={<ShoppingCart />} tone="info" /></div><div className="grid xl:grid-cols-2 gap-4 mt-4"><div className="card bg-base-100 border border-base-300"><div className="card-body"><h2 className="font-bold">Top searched keywords</h2><p className="text-xs text-base-content/60">Popular intent this {period}</p><div className="space-y-3 mt-5">{[['black round glasses', '1,842', 86], ['blue light glasses', '1,206', 66], ['glasses under 2000', '984', 53], ['cat eye frames', '766', 42], ['sunglasses for driving', '522', 28]].map(([key, count, width]) => <div key={String(key)}><div className="flex justify-between text-sm"><span>{key}</span><span className="text-base-content/60">{count}</span></div><progress className="progress progress-primary w-full" value={Number(width)} max={100} /></div>)}</div></div></div><div className="card bg-base-100 border border-base-300"><div className="card-body"><h2 className="font-bold">Search intent signals</h2><p className="text-xs text-base-content/60">What shoppers refine by</p><div className="grid grid-cols-2 gap-3 mt-5">{[['Shape', 'Round', '32%'], ['Budget', 'Under ₹2k', '28%'], ['Brand', 'Nayan House', '21%'], ['Lens', 'Blue-cut', '19%']].map(([label, value, share]) => <div className="bg-base-200 rounded-xl p-4" key={label}><p className="text-xs text-base-content/60">{label}</p><p className="font-bold mt-2">{value}</p><p className="text-xs text-primary mt-1">{share} of searches</p></div>)}</div></div></div></div></> };

const Suppliers: React.FC<Pick<AdminViewProps, 'toast'>> = ({ toast }) => <><AdminHeading eyebrow="Partners" title="Suppliers" action={<button className="btn btn-primary" onClick={() => toast('Supplier invite link copied', 'success')}><Plus size={16} /> Add supplier</button>} /><div className="grid md:grid-cols-3 gap-3">{[['OptiLens India', 'Lenses · 1.6 index', '98% on-time', 'Healthy'], ['FrameCraft Works', 'Frames · Private label', '94% on-time', 'Healthy'], ['Sunmark Labs', 'Sun lenses · Polarised', '89% on-time', 'Review due']].map(([name, speciality, metric, status]) => <div className="card bg-base-100 border border-base-300" key={name}><div className="card-body"><div className="flex justify-between"><div className="p-3 rounded-xl bg-secondary/15 text-secondary"><Store size={20} /></div><span className={`badge badge-sm ${status === 'Healthy' ? 'badge-success' : 'badge-warning'}`}>{status}</span></div><h2 className="card-title mt-2">{name}</h2><p className="text-sm text-base-content/60">{speciality}</p><div className="divider my-2" /><p className="text-sm">{metric}</p><button className="btn btn-ghost btn-sm mt-2 justify-between">View supplier <ChevronRight size={15} /></button></div></div>)}</div></>;

const Reports: React.FC<Pick<AdminViewProps, 'toast'>> = ({ toast }) => <><AdminHeading eyebrow="Insights" title="Reports" action={<button className="btn btn-primary" onClick={() => toast('All reports exported', 'success')}><Download size={16} /> Export all</button>} /><div className="grid md:grid-cols-2 gap-4">{[['Sales & margin', 'Revenue, discounts, GST and contribution margin', 'Updated today'], ['Product performance', 'Sell-through, returns and frame-level demand', 'Updated yesterday'], ['Lens inventory', 'Valuation, reorder history and ageing', 'Updated 4 min ago'], ['Customer cohorts', 'Repeat rate, LTV and acquisition channels', 'Updated 12 Jun']].map(([title, desc, date]) => <div className="card bg-base-100 border border-base-300" key={title}><div className="card-body flex-row items-start gap-4"><div className="p-3 bg-primary/15 text-primary rounded-xl"><FileText size={20} /></div><div className="flex-1"><h2 className="font-bold">{title}</h2><p className="text-sm text-base-content/60 mt-1">{desc}</p><p className="text-xs text-base-content/50 mt-3">{date}</p></div><button className="btn btn-ghost btn-circle btn-sm" onClick={() => toast(`${title} downloaded as CSV`, 'success')}><Download size={15} /></button></div></div>)}</div></>;

const StaffAdmin: React.FC<Pick<AdminViewProps, 'toast'>> = ({ toast }) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const { token } = useAuthStore();
  useEffect(() => {
    axios.get('http://localhost:5000/api/staff', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStaffList(res.data)).catch(err => toast('Failed to load staff', 'error'));
  }, [token]);

  const togglePerm = async (id: string, perm: string, currentPerms: string[]) => {
    const next = currentPerms.includes(perm) ? currentPerms.filter(p => p !== perm) : [...currentPerms, perm];
    try {
      await axios.put(`http://localhost:5000/api/staff/${id}/permissions`, { permissions: next }, { headers: { Authorization: `Bearer ${token}` } });
      setStaffList(prev => prev.map(s => s._id === id ? { ...s, permissions: next } : s));
      toast('Permissions updated', 'success');
    } catch (e) {
      toast('Update failed', 'error');
    }
  };

  const availablePerms = ['overview.view', 'products.view', 'orders.view', 'customers.view', 'inventory.view', 'analytics.view', 'suppliers.view', 'reports.view'];

  return <><AdminHeading eyebrow="Security" title="Staff Management" action={<button className="btn btn-primary" onClick={() => toast('Only via AuthFlow for this prototype', 'info')}><Plus size={16} /> Invite Staff</button>} /><div className="grid gap-4">{staffList.map(s => <div className="card bg-base-100 border border-base-300" key={s._id}><div className="card-body"><h2 className="card-title">{s.name} <span className="badge badge-sm">{s.role}</span></h2><p className="text-sm text-base-content/60">{s.email}</p><div className="divider my-2">Permissions</div><div className="flex flex-wrap gap-2">{availablePerms.map(p => <label key={p} className="cursor-pointer label gap-2 bg-base-200 p-2 rounded-lg text-sm"><input type="checkbox" className="checkbox checkbox-xs" checked={(s.permissions || []).includes(p)} onChange={() => togglePerm(s._id, p, s.permissions || [])} /> {p}</label>)}</div></div></div>)}</div></>;
};
