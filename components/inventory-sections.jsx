'use client'

import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Bell, Building2, Boxes, Download, Package, Plus, ShieldCheck, SlidersHorizontal, Tag, TriangleAlert } from 'lucide-react'

const formatCurrency = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(value)

export function SettingsSection({ settings, onSettingsChange, onSave }) {
  const update = (key, value) => onSettingsChange(current => ({ ...current, [key]: value }))

  return <div className="settings-layout">
    <aside className="settings-nav panel">
      <span className="eyebrow">PREFERENCIAS</span>
      <a href="#business-settings"><Building2 size={16}/> Negocio</a>
      <a href="#inventory-settings"><Boxes size={16}/> Inventario</a>
      <a href="#notification-settings"><Bell size={16}/> Notificaciones</a>
      <div className="settings-nav-note"><ShieldCheck size={16}/><span>Tu espacio de trabajo<br/><strong>Configuración general</strong></span></div>
    </aside>
    <div className="settings-content">
      <section className="panel settings-card" id="business-settings">
        <div className="panel-heading"><div><h2>Información del negocio</h2><p>Personaliza los datos principales de tu espacio.</p></div><span className="settings-card-icon"><Building2 size={18}/></span></div>
        <div className="settings-form-grid">
          <label>Nombre del negocio<input value={settings.businessName} onChange={event => update('businessName', event.target.value)} /></label>
          <label>Actividad<select value={settings.businessType} onChange={event => update('businessType', event.target.value)}><option>Tecnología y electrónica</option><option>Comercio minorista</option><option>Alimentos y bebidas</option><option>Otro</option></select></label>
          <label>Zona horaria<select value={settings.timezone} onChange={event => update('timezone', event.target.value)}><option>Ciudad de México</option><option>Bogotá</option><option>Buenos Aires</option><option>Madrid</option></select></label>
        </div>
      </section>
      <section className="panel settings-card" id="inventory-settings">
        <div className="panel-heading"><div><h2>Reglas de inventario</h2><p>Define cuándo un producto requiere atención.</p></div><span className="settings-card-icon"><SlidersHorizontal size={18}/></span></div>
        <div className="setting-row"><div><strong>Umbral predeterminado de stock bajo</strong><small>Se usa al crear productos nuevos. Cada producto puede tener su propio mínimo.</small></div><label className="number-setting"><input aria-label="Umbral predeterminado de stock bajo" type="number" min="0" max="9999" value={settings.defaultMinimum} onChange={event => update('defaultMinimum', event.target.value)} /><span>unidades</span></label></div>
        <div className="setting-row"><div><strong>Mostrar alertas de existencias agotadas</strong><small>Incluir productos sin unidades disponibles en el resumen.</small></div><button type="button" role="switch" aria-checked={settings.showOutOfStock} aria-label="Mostrar alertas de existencias agotadas" className={`toggle-switch ${settings.showOutOfStock ? 'is-on' : ''}`} onClick={() => update('showOutOfStock', !settings.showOutOfStock)}><span /></button></div>
      </section>
      <section className="panel settings-card" id="notification-settings">
        <div className="panel-heading"><div><h2>Notificaciones</h2><p>Elige qué avisos quieres ver en el panel.</p></div><span className="settings-card-icon"><Bell size={18}/></span></div>
        <div className="setting-row"><div><strong>Alertas de stock bajo</strong><small>Avísame cuando un producto llegue a su mínimo.</small></div><button type="button" role="switch" aria-checked={settings.lowStockAlerts} aria-label="Alertas de stock bajo" className={`toggle-switch ${settings.lowStockAlerts ? 'is-on' : ''}`} onClick={() => update('lowStockAlerts', !settings.lowStockAlerts)}><span /></button></div>
        <div className="setting-row"><div><strong>Resumen semanal</strong><small>Recibir un resumen del movimiento de inventario.</small></div><button type="button" role="switch" aria-checked={settings.weeklySummary} aria-label="Resumen semanal" className={`toggle-switch ${settings.weeklySummary ? 'is-on' : ''}`} onClick={() => update('weeklySummary', !settings.weeklySummary)}><span /></button></div>
      </section>
      <div className="settings-actions"><span>Los cambios se aplican a esta sesión.</span><button className="button-primary" onClick={onSave}>Aplicar preferencias</button></div>
    </div>
  </div>
}

export function CategoriesSection({ categories, products, onOpenCategory, onCreateCategory }) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const submitCategory = event => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return setCategoryError('Escribe un nombre para la categoría.')
    if (categories.some(category => category.toLowerCase() === name.toLowerCase())) return setCategoryError('Ya existe una categoría con ese nombre.')
    if (onCreateCategory(name)) { setCategoryName(''); setCategoryError(''); setCreatingCategory(false) }
  }
  const summaries = categories.map((name, index) => {
    const items = products.filter(product => product.category === name)
    return { name, items, count: items.length, units: items.reduce((sum, product) => sum + product.stock, 0), value: items.reduce((sum, product) => sum + product.price * product.stock, 0), attention: items.filter(product => product.stock <= product.min).length, tone: ['cyan', 'purple', 'pink', 'blue'][index % 4] }
  })
  const totalValue = summaries.reduce((sum, category) => sum + category.value, 0)

  return <div className="section-stack">
    <section className="category-overview-grid" aria-label="Resumen de categorías">
      <article className="panel overview-stat"><span className="overview-stat-icon"><Tag size={17}/></span><span>Categorías activas</span><strong>{categories.length}</strong><small>En tu catálogo</small></article>
      <article className="panel overview-stat"><span className="overview-stat-icon cyan"><Package size={17}/></span><span>Productos clasificados</span><strong>{products.length}</strong><small>En todas las categorías</small></article>
      <article className="panel overview-stat"><span className="overview-stat-icon purple"><Boxes size={17}/></span><span>Unidades en inventario</span><strong>{products.reduce((sum, product) => sum + product.stock, 0)}</strong><small>Valor al precio de venta: {formatCurrency(totalValue)}</small></article>
    </section>
    <section className="panel section-panel">
      <div className="panel-heading"><div><h2>Organización del catálogo</h2><p>Explora la composición y el estado de cada categoría.</p></div><button className="button-primary" type="button" onClick={() => { setCreatingCategory(value => !value); setCategoryError('') }}><Plus size={16}/> Nueva categoría</button></div>
      {creatingCategory && <form className="category-create-form" onSubmit={submitCategory}><label htmlFor="new-category-name">Nombre de la categoría</label><div><input id="new-category-name" autoFocus maxLength={40} value={categoryName} onChange={event => { setCategoryName(event.target.value); setCategoryError('') }} placeholder="Ej. Papelería" aria-describedby={categoryError ? 'category-create-error' : undefined} aria-invalid={Boolean(categoryError)} /><button className="button-primary" type="submit">Crear categoría</button><button className="button-quiet" type="button" onClick={() => { setCreatingCategory(false); setCategoryName(''); setCategoryError('') }}>Cancelar</button></div>{categoryError && <small id="category-create-error" role="alert">{categoryError}</small>}</form>}
      <div className="category-cards-grid">{summaries.map(category => <article className={`category-card tone-${category.tone}`} key={category.name}>
        <div className="category-card-top"><span className="category-symbol"><Tag size={17}/></span><span className="category-product-count">{category.count} {category.count === 1 ? 'producto' : 'productos'}</span></div>
        <h3>{category.name}</h3>
        <div className="category-facts"><div><span>Unidades</span><strong>{category.units}</strong></div><div><span>Valor inventario</span><strong>{formatCurrency(category.value)}</strong></div></div>
        <div className="category-card-bottom"><span className={category.attention > 0 ? 'category-warning' : 'category-ok'}>{category.attention > 0 ? `${category.attention} requieren atención` : 'Stock saludable'}</span><button className="text-link" onClick={() => onOpenCategory(category.name)}>Ver productos <ArrowUpRight size={14}/></button></div>
      </article>)}</div>
    </section>
    <section className="panel category-summary-panel"><div className="panel-heading"><div><h2>Distribución del catálogo</h2><p>Productos registrados por categoría.</p></div></div><div className="category-distribution">{summaries.map(category => <div className="distribution-row" key={category.name}><div className="distribution-label"><span>{category.name}</span><strong>{category.count} <small>productos</small></strong></div><div className="distribution-track" role="meter" aria-label={`${category.name}: ${category.count} productos`} aria-valuemin="0" aria-valuemax={products.length || 1} aria-valuenow={category.count}><span className={`distribution-fill tone-${category.tone}`} style={{ width: `${products.length ? category.count / products.length * 100 : 0}%` }} /></div></div>)}</div></section>
  </div>
}

export function ReportsSection({ products, categories, currency, showOutOfStock, onExport }) {
  const summaries = categories.map((name, index) => {
    const items = products.filter(product => product.category === name)
    return { name, count: items.length, units: items.reduce((sum, product) => sum + product.stock, 0), value: items.reduce((sum, product) => sum + product.price * product.stock, 0), tone: ['cyan', 'purple', 'pink', 'blue'][index % 4] }
  })
  const units = products.reduce((sum, product) => sum + product.stock, 0)
  const stockValue = products.reduce((sum, product) => sum + product.price * product.stock, 0)
  const lowStock = products.filter(product => product.stock > 0 && product.stock <= product.min)
  const outOfStock = products.filter(product => product.stock === 0)
  const attentionCount = lowStock.length + (showOutOfStock ? outOfStock.length : 0)
  const healthy = products.filter(product => product.stock > product.min)
  const reportCurrency = new Intl.NumberFormat('es-MX', { style: 'currency', currency })
  const maxUnits = Math.max(...summaries.map(category => category.units), 1)

  return <div className="section-stack">
    <section className="report-kpi-grid" aria-label="Indicadores del inventario">
      <article className="panel report-kpi"><span>Valor del inventario</span><strong>{reportCurrency.format(stockValue)}</strong><small>Calculado al precio de venta</small><span className="report-kpi-icon purple"><Boxes size={17}/></span></article>
      <article className="panel report-kpi"><span>Unidades disponibles</span><strong>{units.toLocaleString('es-MX')}</strong><small>En {products.length} productos</small><span className="report-kpi-icon cyan"><Package size={17}/></span></article>
      <article className="panel report-kpi"><span>Stock bajo</span><strong>{lowStock.length}</strong><small>Requieren reposición</small><span className="report-kpi-icon coral"><TriangleAlert size={17}/></span></article>
      <article className="panel report-kpi"><span>Sin existencias</span><strong>{showOutOfStock ? outOfStock.length : 'Oculto'}</strong><small>{showOutOfStock ? 'Productos agotados' : 'Desactivado en configuración'}</small><span className="report-kpi-icon pink"><Boxes size={17}/></span></article>
    </section>
    <div className="report-grid">
      <section className="panel report-panel"><div className="panel-heading"><div><h2>Inventario por categoría</h2><p>Unidades disponibles y valor estimado por grupo.</p></div><span className="section-heading-mark"><Boxes size={19}/></span></div><div className="report-category-list">{summaries.map(category => <div className="report-category-row" key={category.name}><div className="report-category-heading"><div><span className={`report-dot tone-${category.tone}`}/><strong>{category.name}</strong></div><span>{category.units} <small>unidades</small></span></div><div className="distribution-track" role="meter" aria-label={`${category.name}: ${category.units} unidades`} aria-valuemin="0" aria-valuemax={maxUnits} aria-valuenow={category.units}><span className={`distribution-fill tone-${category.tone}`} style={{ width: `${category.units / maxUnits * 100}%` }} /></div><div className="report-category-foot"><span>{category.count} productos</span><strong>{reportCurrency.format(category.value)}</strong></div></div>)}</div></section>
      <section className="panel report-panel stock-health-panel"><div className="panel-heading"><div><h2>Estado de existencias</h2><p>Distribución actual de los productos.</p></div></div><div className="stock-health-total"><strong>{products.length}</strong><span>productos evaluados</span></div><div className="health-bar" aria-label="Estado de existencias"><span className="health-healthy" style={{ width: `${products.length ? healthy.length / products.length * 100 : 0}%` }}/><span className="health-low" style={{ width: `${products.length ? lowStock.length / products.length * 100 : 0}%` }}/><span className="health-empty" style={{ width: `${products.length ? outOfStock.length / products.length * 100 : 0}%` }}/></div><div className="health-legend"><div><i className="health-healthy"/><span>En stock</span><strong>{healthy.length}</strong></div><div><i className="health-low"/><span>Stock bajo</span><strong>{lowStock.length}</strong></div>{showOutOfStock && <div><i className="health-empty"/><span>Agotado</span><strong>{outOfStock.length}</strong></div>}</div><div className={`report-insight ${attentionCount === 0 ? 'report-insight-ok' : ''}`}>{attentionCount > 0 ? <><TriangleAlert size={16}/><span><strong>{attentionCount} productos</strong> necesitan revisión o reposición.</span></> : <><ArrowUpRight size={16}/><span>Todos los productos están por encima de su mínimo.</span></>}</div></section>
    </div>
    <section className="panel report-panel"><div className="panel-heading"><div><h2>Productos que requieren atención</h2><p>Revisa las existencias antes de la próxima reposición.</p></div><span className="report-attention-count">{lowStock.length + (showOutOfStock ? outOfStock.length : 0)}</span></div>{lowStock.length + (showOutOfStock ? outOfStock.length : 0) > 0 ? <div className="report-attention-list">{[...lowStock, ...(showOutOfStock ? outOfStock : [])].map(product => <div className="report-attention-row" key={product.id}><div><strong>{product.name}</strong><small>{product.sku} · {product.category}</small></div><span className="category-warning">{product.stock === 0 ? 'Agotado' : `${product.stock} de ${product.min} mín.`}</span></div>)}</div> : <div className="report-empty"><ArrowUpRight size={18}/> Sin productos que requieran atención.</div>}</section>
    <div className="report-actions"><span>Reporte de corte actual · Valores expresados en {currency}</span><button className="button-quiet" onClick={onExport}><Download size={15}/> Descargar CSV</button></div>
  </div>
}
