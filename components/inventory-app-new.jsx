'use client'

import { useMemo, useState, useEffect } from 'react'
import { Bell, Boxes, ChartNoAxesColumn, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Command, LayoutDashboard, Menu, MoreHorizontal, Package, Plus, Search, Settings, SlidersHorizontal, Tag, TrendingUp, X, ArrowDownRight, ArrowUpRight, AlertTriangle, Pencil, Trash2, Laptop, Headphones, Mouse, Keyboard, Monitor, Cable, PackageOpen, Check } from 'lucide-react'
import { CategoriesSection, ReportsSection, SettingsSection } from './inventory-sections'
import { InventoryMovements, MovementDialog } from './inventory-movements'
import { api } from '@/lib/api-client'

// Navigation items
const navItems = [
  ['Dashboard', LayoutDashboard],
  ['Productos', Package],
  ['Categorías', Tag],
  ['Inventario', Boxes],
  ['Reportes', ChartNoAxesColumn],
  ['Configuración', Settings]
]

// Currency formatter
const money = (value) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(Number(value) || 0)

// Status determination function
const statusFor = (product) => 
  product.stock === 0 ? 'Agotado' : product.stock <= product.min ? 'Stock bajo' : 'En stock'

// Status component
function Status({ product }) {
  const status = statusFor(product)
  return (
    <span className={`status status-${status === 'En stock' ? 'ok' : status === 'Agotado' ? 'empty' : 'low'}`}>
      <i />{status}
    </span>
  )
}

// Map of icon names stored in the database to Lucide components
const iconMap = { Keyboard, Mouse, Monitor, Headphones, Cable, Laptop, Package, PackageOpen }

// Product icon component
function ProductIcon({ product }) {
  const Icon = iconMap[product.icon] || Package
  return (
    <span className={`product-icon ${product.tone || 'violet'}`}>
      <Icon size={18} strokeWidth={1.7} />
    </span>
  )
}

// Sidebar component
function Sidebar({ active, onNavigate, open, onClose, productCount }) {
  return (
    <>
      <button 
        className={`mobile-scrim ${open ? 'visible' : ''}`} 
        aria-label="Cerrar menú" 
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <Boxes size={20} />
          </span>
          <span>STOCKLY<small>INVENTORY SYSTEM</small></span>
          <button 
            className="close-menu" 
            onClick={onClose} 
            aria-label="Cerrar menú"
          >
            <X size={19}/>
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Navegación principal">
          {navItems.map(([label, Icon]) => (
            <button 
              key={label} 
              className={`nav-item ${active === label ? 'active' : ''}`} 
              onClick={() => { onNavigate(label); onClose() }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Productos' && (
                <span className="nav-count">{productCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <CircleHelp size={16}/>
            </span>
            <div>
              <strong>¿Necesitas ayuda?</strong>
              <small>Visita nuestro centro de ayuda</small>
            </div>
            <ChevronRight size={15}/>
          </div>
          <div className="profile">
            <div className="avatar">MG</div>
            <div className="profile-copy">
              <strong>María García</strong>
              <small>Administradora</small>
            </div>
            <MoreHorizontal size={18}/>
          </div>
        </div>
      </aside>
    </>
  )
}

// Product modal component
function ProductModal({ product, onClose, onSave, defaultMinimum, categories }) {
  const [form, setForm] = useState(product || { 
    name: '', 
    sku: '', 
    description: '', 
    category: 'Periféricos', 
    cost: '', 
    price: '', 
    stock: '0', 
    min: defaultMinimum, 
    image: '' 
  })
  const [error, setError] = useState('')
  
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  
  function submit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.sku.trim()) {
      return setError('Completa el nombre y el código SKU.')
    }
    if ([form.price, form.stock, form.min].some(value => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) {
      return setError('Verifica que precio y existencias sean valores válidos.')
    }
    onSave({
      ...form, 
      name: form.name.trim(), 
      sku: form.sku.trim(), 
      price: Number(form.price), 
      stock: Number(form.stock), 
      min: Number(form.min), 
      id: product?.id || Date.now(), 
      icon: product?.icon || 'Package', 
      tone: product?.tone || 'violet' 
    })
  }
  
  return (
    <div 
      className="modal-backdrop" 
      onMouseDown={event => { 
        if (event.target === event.currentTarget) onClose() 
      }}
    >
      <section 
        className="modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">CATÁLOGO DE PRODUCTOS</span>
            <h2 id="modal-title">{product ? 'Editar producto' : 'Agregar producto'}</h2>
            <p>Completa la información del producto para el inventario.</p>
          </div>
          <button 
            className="icon-button" 
            onClick={onClose} 
            aria-label="Cerrar"
          >
            <X size={19}/>
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Nombre del producto
              <input 
                autoFocus 
                value={form.name} 
                onChange={e => update('name', e.target.value)} 
                placeholder="Ej. Teclado mecánico" 
              />
            </label>
            <label>
              Código SKU
              <input 
                value={form.sku} 
                onChange={e => update('sku', e.target.value)} 
                placeholder="Ej. TEC-001" 
              />
            </label>
            <label className="wide">
              Descripción
              <textarea 
                value={form.description || ''} 
                onChange={e => update('description', e.target.value)} 
                placeholder="Detalles del producto" 
                rows="3" 
              />
            </label>
            <label>
              Categoría
              <select 
                value={form.category} 
                onChange={e => update('category', e.target.value)}
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Imagen del producto
              <input 
                value={form.image || ''} 
                onChange={e => update('image', e.target.value)} 
                placeholder="URL de imagen (opcional)" 
              />
            </label>
            <label>
              Precio de compra
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.cost ?? ''} 
                onChange={e => update('cost', e.target.value)} 
                placeholder="0.00" 
              />
            </label>
            <label>
              Precio de venta
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.price ?? ''} 
                onChange={e => update('price', e.target.value)} 
                placeholder="0.00" 
              />
            </label>
            <label>
              Stock inicial (registra entradas después)
              <input 
                type="number" 
                value={form.stock ?? 0} 
                readOnly 
                aria-readonly="true" 
              />
            </label>
            <label>
              Stock mínimo
              <input 
                type="number" 
                min="0" 
                step="1" 
                value={form.min ?? ''} 
                onChange={e => update('min', e.target.value)} 
                placeholder="0" 
              />
            </label>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button-quiet">Cancelar</button>
            <button type="submit" className="button-primary">Guardar producto</button>
          </div>
        </form>
      </section>
    </div>
  )
}

// Product table component
function ProductTable({ products, onEdit, onDelete, onAdjust }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>PRODUCTO</th>
            <th>CÓDIGO SKU</th>
            <th>CATEGORÍA</th>
            <th>PRECIO</th>
            <th>STOCK</th>
            <th>ESTADO</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>
                <div className="product-cell">
                  <ProductIcon product={product}/>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.description || 'Producto de inventario'}</small>
                  </div>
                </div>
              </td>
              <td className="sku">{product.sku}</td>
              <td>{product.category}</td>
              <td className="price">{money(product.price)}</td>
              <td>
                <div className="stock-cell">
                  <button 
                    aria-label={`Restar stock a ${product.name}`} 
                    onClick={() => onAdjust(product.id, -1)} 
                    disabled={product.stock <= 0}
                  >
                    −
                  </button>
                  <strong>{product.stock}</strong>
                  <button 
                    aria-label={`Sumar stock a ${product.name}`} 
                    onClick={() => onAdjust(product.id, 1)}
                  >
                    +
                  </button>
                </div>
              </td>
              <td>
                <Status product={product}/>
              </td>
              <td>
                <div className="row-actions">
                  <button 
                    aria-label={`Editar ${product.name}`} 
                    onClick={() => onEdit(product)}
                  >
                    <Pencil size={15}/>
                  </button>
                  <button 
                    aria-label={`Eliminar ${product.name}`} 
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 size={15}/>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="empty-state">
          <PackageOpen size={26}/>
          <strong>No encontramos productos</strong>
          <span>Prueba otra búsqueda o cambia los filtros.</span>
        </div>
      )}
    </div>
  )
}

// Main application component
export default function InventoryApp() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [categories, setCategories] = useState(['Periféricos', 'Monitores', 'Audio', 'Accesorios'])
  const [active, setActive] = useState('Dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas las categorías')
  const [availability, setAvailability] = useState('Todos los estados')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [settings, setSettings] = useState({
    businessName: 'Stockly', 
    businessType: 'Tecnología y electrónica', 
    defaultMinimum: '8', 
    showOutOfStock: true, 
    lowStockAlerts: true, 
    weeklySummary: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load initial data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load products
        const productsResponse = await api.products.getAll()
        setProducts(productsResponse.products || [])
        
        // Load movements (will be implemented separately)
        setMovements([])
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('No se pudo cargar el inventario. Verifica la conexión con la base de datos.')
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Helper functions
  const lowStock = useMemo(() => products.filter(p => p.stock <= p.min), [products])
  const units = products.reduce((sum, item) => sum + Number(item.stock), 0)
  
  const filtered = useMemo(() => {
    let list = products.filter(p => 
      `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()) &&
      (category === 'Todas las categorías' || p.category === category) &&
      (availability === 'Todos los estados' || statusFor(p) === availability)
    )
    
    if (sort === 'price') list = [...list].sort((a,b) => a.price - b.price)
    if (sort === 'name') list = [...list].sort((a,b) => a.name.localeCompare(b.name))
    if (sort === 'stock') list = [...list].sort((a,b) => a.stock - b.stock)
    
    return list
  }, [products, query, category, availability, sort])

  const perPage = 6
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage))
  const visible = filtered.slice((page-1) * perPage, page * perPage)

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  // API-based functions
  async function saveProduct(product) {
    try {
      const existing = products.find(p => p.id === product.id)
      const exists = Boolean(existing)
      
      if (exists) {
        // Update existing product
        const updatedProduct = await api.products.update(product.id, product)
        setProducts(current => current.map(p => p.id === product.id ? updatedProduct : p))
        notify('Producto actualizado correctamente')
      } else {
        // Create new product
        const createdProduct = await api.products.create(product)
        setProducts(current => [createdProduct, ...current])
        notify('Producto agregado con stock inicial en cero')
      }
      
      setModal(null)
    } catch (err) {
      console.error('Error saving product:', err)
      notify('Error al guardar producto: ' + err.message)
    }
  }

  function removeProduct(product) {
    if (window.confirm(`¿Eliminar "${product.name}" del inventario?`)) {
      api.products.delete(product.id)
        .then(() => {
          setProducts(current => current.filter(p => p.id !== product.id))
          notify('Producto eliminado del inventario')
        })
        .catch(err => {
          console.error('Error deleting product:', err)
          notify('Error al eliminar producto: ' + err.message)
        })
    }
  }

  function adjustStock(id, amount) {
    setModal({ mode: 'movement', movementType: amount > 0 ? 'in' : 'out', productId: id })
  }

  function registerMovement(movementData) {
    // This would be handled by the movements API
    console.log('Movement registered:', movementData)
    notify('Movimiento registrado')
  }

  function exportReport() {
    // Generate CSV report from current data
    const rows = [['Categoría', 'Productos', 'Unidades', 'Valor del inventario (GTQ)'], 
      ...categories.map(name => {
        const items = products.filter(product => product.category === name)
        return [name, items.length, items.reduce((sum, product) => sum + product.stock, 0), items.reduce((sum, product) => sum + product.price * product.stock, 0).toFixed(2)]
      })
    ]
    
    const csv = rows.map(row => row.map(value => `\"${String(value).replaceAll('"', '""')}\"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'stockly-reporte-inventario.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify('Reporte descargado')
  }

  const categoryColors = ['var(--cyan)', 'var(--purple)', 'var(--pink)', 'var(--blue)']
  const counts = categories.map((name, index) => ({
    name, 
    count: products.filter(p => p.category === name).length, 
    color: categoryColors[index % categoryColors.length]
  }))

  const onProducts = active === 'Productos'

  if (loading) {
    return (
      <div className="app-shell">
        <div className="loading-indicator">Cargando inventario...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar 
        active={active} 
        onNavigate={setActive} 
        open={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
        productCount={products.length} 
      />
      <main className="main-area">
        <header className="topbar">
          <button 
            className="mobile-menu" 
            onClick={() => setMobileOpen(true)} 
            aria-label="Abrir menú"
          >
            <Menu size={20}/>
          </button>
          <div className="crumb">
            <span>Workspace</span>
            <ChevronDown size={14}/>
            <span className="crumb-current">{active}</span>
          </div>
          <div className="top-actions">
            <span className="live-status">
              <i/>Sistema operativo
            </span>
            <button className="icon-button notification" aria-label="Notificaciones">
              <Bell size={18}/><i/>
            </button>
            <div className="top-avatar">MG</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {active === 'Dashboard' ? <>CONTROL DE INVENTARIO <span className="eyebrow-dot">·</span> VISTA GENERAL</> : active === 'Categorías' ? <>GESTIÓN DEL CATÁLOGO <span className="eyebrow-dot">·</span> CLASIFICACIÓN</> : active === 'Reportes' ? <>ANÁLISIS <span className="eyebrow-dot">·</span> INVENTARIO ACTUAL</> : active === 'Configuración' ? <>PREFERENCIAS <span className="eyebrow-dot">·</span> ESPACIO DE TRABAJO</> : active === 'Inventario' ? <>INVENTARIO <span className="eyebrow-dot">·</span> MOVIMIENTOS</> : <>CONTROL DE INVENTARIO <span className="eyebrow-dot">·</span> CATÁLOGO</>}
              </span>
              <h1>
                {active === 'Dashboard' ? 'Dashboard Overview' : active === 'Reportes' ? 'Reportes de inventario' : active === 'Configuración' ? 'Configuración del negocio' : active}
              </h1>
              <p>
                {active === 'Dashboard' ? 'Aquí tienes un resumen de lo que sucede en tu inventario hoy.' : active === 'Categorías' ? 'Organiza los productos y consulta el valor de cada grupo.' : active === 'Reportes' ? 'Analiza niveles, existencias y valor del inventario actual.' : active === 'Configuración' ? 'Ajusta la información del negocio y las alertas de inventario.' : active === 'Inventario' ? 'Registra entradas, salidas y consulta el ...' : 'Administra el catálogo de productos.'}
              </p>
            </div>
          </div>

          {active === 'Dashboard' && (
            <section className="stats-grid" aria-label="Resumen del inventario">
              <article className="stat-card">
                <div className="stat-top">
                  <span>Total de productos</span>
                  <span className="stat-icon purple"><Package size={17}/></span>
                </div>
                <div className="stat-value">{products.length}<span className="stat-unit">productos</span></div>
                <div className="stat-bottom">
                  <span className="trend positive"><ArrowUpRight size={14}/> 12.5%</span>
                  <span>vs. mes anterior</span>
                  <span className="spark spark-purple" aria-hidden="true">
                    <i/><i/><i/><i/><i/><i/><i/><i/><i/>
                  </span>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <span>Unidades disponibles</span>
                  <span className="stat-icon cyan"><Boxes size={17}/></span>
                </div>
                <div className="stat-value">{units}<span className="stat-unit">unidades</span></div>
                <div className="stat-bottom">
                  <span className="trend positive"><ArrowUpRight size={14}/> 8.2%</span>
                  <span>vs. mes anterior</span>
                  <span className="spark spark-cyan" aria-hidden="true">
                    <i/><i/><i/><i/><i/><i/><i/><i/><i/>
                  </span>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <span>Productos con stock bajo</span>
                  <span className="stat-icon coral"><AlertTriangle size={17}/></span>
                </div>
                <div className="stat-value">{lowStock.length}<span className="stat-unit">requieren atención</span></div>
                <div className="stat-bottom">
                  <span className="trend negative"><ArrowDownRight size={14}/> 3.1%</span>
                  <span>vs. mes anterior</span>
                  <span className="spark spark-coral" aria-hidden="true">
                    <i/><i/><i/><i/><i/><i/><i/><i/><i/>
                  </span>
                </div>
              </article>
            </section>
          )}

          {active === 'Inventario' ? (
            <InventoryMovements 
              products={products} 
              movements={movements} 
              units={units} 
              onRegister={registerMovement}
            />
          ) : onProducts && (
            <section className="panel products-panel">
              <div className="panel-heading">
                <div>
                  <h2>Todos los productos <span className="heading-count">{filtered.length}</span></h2>
                  <p>Administra el catálogo y controla tus existencias.</p>
                </div>
                <button className="button-quiet filter-button">
                  <SlidersHorizontal size={15}/> Filtros
                </button>
              </div>

              <div className="filters">
                <label className="search-box">
                  <Search size={17}/>
                  <input 
                    aria-label="Buscar productos" 
                    placeholder="Buscar por nombre o SKU..." 
                    value={query} 
                    onChange={e => {setQuery(e.target.value);setPage(1)}}
                  />
                  <kbd>⌘ K</kbd>
                </label>
                <select 
                  aria-label="Filtrar por categoría" 
                  value={category} 
                  onChange={e => {setCategory(e.target.value);setPage(1)}}
                >
                  <option>Todas las categorías</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select 
                  aria-label="Filtrar por disponibilidad" 
                  value={availability} 
                  onChange={e => {setAvailability(e.target.value);setPage(1)}}
                >
                  <option>Todos los estados</option>
                  <option>En stock</option>
                  <option>Stock bajo</option>
                  <option>Agotado</option>
                </select>
                <select 
                  aria-label="Ordenar productos" 
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="recent">Más recientes</option>
                  <option value="name">Nombre</option>
                  <option value="price">Precio</option>
                  <option value="stock">Stock</option>
                </select>
              </div>

              <ProductTable 
                products={visible} 
                onEdit={product => setModal(product)} 
                onDelete={removeProduct} 
                onAdjust={adjustStock}
              />

              <div className="table-footer">
                <span>
                  Mostrando <strong>{filtered.length ? (page-1)*perPage+1 : 0}–{Math.min(page*perPage, filtered.length)}</strong> de <strong>{filtered.length}</strong> productos
                </span>
                <div className="pagination">
                  <button 
                    aria-label="Página anterior" 
                    disabled={page <= 1} 
                    onClick={() => setPage(page-1)}
                  >
                    <ChevronLeft size={16}/>
                  </button>
                  <span>Página {page} de {pageCount}</span>
                  <button 
                    aria-label="Página siguiente" 
                    disabled={page >= pageCount} 
                    onClick={() => setPage(page+1)}
                  >
                    <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            </section>
          )}

          {active === 'Categorías' && (
            <CategoriesSection 
              categories={categories} 
              products={products} 
              onOpenCategory={(categoryName) => setActive('Dashboard')}
              onCreateCategory={(name) => {
                setCategories([...categories, name])
                return true
              }}
            />
          )}

          {active === 'Reportes' && (
            <ReportsSection 
              products={products} 
              categories={categories} 
              currency="GTQ"
              showOutOfStock={settings.showOutOfStock}
              onExport={exportReport}
            />
          )}

          {active === 'Configuración' && (
            <SettingsSection 
              settings={settings} 
              onSettingsChange={setSettings} 
              onSave={() => notify('Configuración guardada')}
            />
          )}

          {active === 'Productos' && (
            <div className="panel products-intro">
              <h2>Catálogo de productos</h2>
              <p>Administra el catálogo y controla tus existencias.</p>
              <button 
                className="button-primary" 
                onClick={() => setModal({ mode: 'new' })}
              >
                <Plus size={16}/> Agregar producto
              </button>
            </div>
          )}

          <footer className="app-footer">
            <span>© 2025 Stockly <span>·</span> Control inteligente de inventario</span>
            <span>Hecho para crecer contigo <span className="footer-heart">✦</span></span>
          </footer>
        </div>

        {modal?.mode === 'movement' ? (
          <MovementDialog 
            type={modal.movementType} 
            initialProductId={modal.productId} 
            products={products} 
            onClose={() => setModal(null)} 
            onRegister={payload => { registerMovement(payload); setModal(null) }}
          />
        ) : modal && (
          <ProductModal 
            product={modal.mode === 'new' ? null : modal} 
            onClose={() => setModal(null)} 
            onSave={saveProduct} 
            defaultMinimum={settings.defaultMinimum} 
            categories={categories}
          />
        )}

        <div className={`toast ${toast ? 'toast-show' : ''}`} role="status">
          <Check size={16}/>{toast}
        </div>
      </main>
    </div>
  )
}