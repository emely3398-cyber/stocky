'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Boxes, CalendarDays, Plus, Search, X } from 'lucide-react'

const exitReasons = ['Uso interno', 'Producto dañado', 'Producto perdido', 'Devolución a proveedor', 'Ajuste de inventario', 'Otro motivo']
const formatDate = value => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export function MovementDialog({ type, products, initialProductId, onClose, onRegister }) {
  const [productId, setProductId] = useState(String(initialProductId || products[0]?.id || ''))
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [reason, setReason] = useState(type === 'in' ? 'Compra' : exitReasons[0])
  const [supplier, setSupplier] = useState('')
  const [reference, setReference] = useState('')
  const [responsible, setResponsible] = useState('María García')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const product = products.find(item => String(item.id) === productId)

  function submit(event) {
    event.preventDefault()
    const amount = Number(quantity)
    if (!product) return setError('Selecciona un producto disponible.')
    if (!Number.isInteger(amount) || amount <= 0) return setError('La cantidad debe ser un número entero mayor que cero.')
    if (type === 'out' && amount > product.stock) return setError(`No puedes retirar más de ${product.stock} unidades disponibles.`)
    if (!date || !responsible.trim()) return setError('Completa la fecha y el responsable.')
    const movementLabel = type === 'in' ? 'entrada' : 'salida'
    if (!window.confirm(`¿Confirmas registrar ${movementLabel} de ${amount} unidades de ${product.name}?`)) return
    onRegister({ product, type, quantity: amount, date: new Date(date).toISOString(), reason: type === 'in' ? reason.trim() || 'Entrada' : reason, supplier: supplier.trim(), reference: reference.trim(), responsible: responsible.trim(), notes: notes.trim() })
  }

  return <div className="movement-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="movement-dialog" role="dialog" aria-modal="true" aria-labelledby="movement-dialog-title"><header className="movement-dialog-head"><div><span className="eyebrow">CONTROL DE EXISTENCIAS</span><h2 id="movement-dialog-title">{type === 'in' ? 'Registrar entrada' : 'Registrar salida'}</h2><p>{type === 'in' ? 'Suma unidades al stock y deja constancia del ingreso.' : 'La salida quedará registrada en el historial del producto.'}</p></div><button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}><X size={18}/></button></header><form onSubmit={submit} className="movement-form"><label>Producto<select value={productId} onChange={event => { setProductId(event.target.value); setError('') }} required><option value="">Selecciona un producto</option>{products.map(item => <option key={item.id} value={item.id}>{item.name} · {item.sku}</option>)}</select></label>{type === 'out' && <div className="movement-stock-readout"><span>Stock actual</span><strong>{product?.stock ?? '—'} <small>unidades</small></strong></div>}<div className="movement-form-grid"><label>Cantidad<input type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={event => { setQuantity(event.target.value); setError('') }} placeholder="0" required /></label><label>Fecha del movimiento<input type="datetime-local" value={date} onChange={event => setDate(event.target.value)} required /></label>{type === 'in' ? <><label>Proveedor <span>(opcional)</span><input value={supplier} onChange={event => setSupplier(event.target.value)} placeholder="Nombre del proveedor" /></label><label>Referencia <span>(opcional)</span><input value={reference} onChange={event => setReference(event.target.value)} placeholder="Factura o pedido" /></label></> : <><label>Tipo de salida<select value={reason} onChange={event => setReason(event.target.value)}>{exitReasons.map(item => <option key={item}>{item}</option>)}</select></label><label>Responsable<input value={responsible} onChange={event => setResponsible(event.target.value)} required /></label></>}<label className="movement-wide">{type === 'in' ? 'Observaciones' : 'Observaciones o justificación'}<textarea rows="3" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Agrega detalles para el historial" /></label>{type === 'in' && <label>Responsable<input value={responsible} onChange={event => setResponsible(event.target.value)} required /></label>}</div>{error && <p className="movement-error" role="alert">{error}</p>}<footer className="movement-form-actions"><button type="button" className="button-quiet" onClick={onClose}>Cancelar</button><button type="submit" className="button-primary">{type === 'in' ? <ArrowDownRight size={16}/> : <ArrowUpRight size={16}/>} Confirmar {type === 'in' ? 'entrada' : 'salida'}</button></footer></form></section></div>
}

export function InventoryMovements({ products, movements, units, onRegister }) {
  const [dialog, setDialog] = useState(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const entries = movements.filter(item => item.type === 'in').reduce((sum, item) => sum + item.quantity, 0)
  const exits = movements.filter(item => item.type === 'out').reduce((sum, item) => sum + item.quantity, 0)
  const reasons = [...new Set(movements.map(item => item.reason).filter(Boolean))]
  const filteredMovements = useMemo(() => movements.filter(item => {
    const search = `${item.productName} ${item.sku}`.toLowerCase().includes(query.trim().toLowerCase())
    const date = item.date.slice(0, 10)
    return search && (typeFilter === 'all' || item.type === typeFilter) && (reasonFilter === 'all' || item.reason === reasonFilter) && (!fromDate || date >= fromDate) && (!toDate || date <= toDate)
  }), [movements, query, typeFilter, reasonFilter, fromDate, toDate])

  function registerMovement(data) {
    onRegister(data)
    setDialog(null)
  }

  return <div className="inventory-module"><section className="inventory-kpis" aria-label="Resumen de movimientos"><article className="panel inventory-kpi"><span className="inventory-kpi-icon incoming"><ArrowDownRight size={18}/></span><span>Total de entradas</span><strong>{entries.toLocaleString('es-MX')}</strong><small>unidades recibidas</small></article><article className="panel inventory-kpi"><span className="inventory-kpi-icon outgoing"><ArrowUpRight size={18}/></span><span>Total de salidas</span><strong>{exits.toLocaleString('es-MX')}</strong><small>unidades retiradas</small></article><article className="panel inventory-kpi"><span className="inventory-kpi-icon available"><Boxes size={18}/></span><span>Unidades disponibles</span><strong>{units.toLocaleString('es-MX')}</strong><small>en {products.length} productos</small></article></section><section className="panel movement-panel"><div className="movement-panel-head"><div><h2>Movimientos recientes</h2><p>Entradas y salidas registradas para tus productos.</p></div><div className="movement-actions"><button type="button" className="button-quiet movement-entry" onClick={() => setDialog({ type: 'in' })}><Plus size={16}/> Registrar entrada</button><button type="button" className="button-primary movement-exit" onClick={() => setDialog({ type: 'out' })}><ArrowUpRight size={16}/> Registrar salida</button></div></div><div className="movement-filters"><label className="movement-search"><Search size={16}/><input aria-label="Buscar por producto o SKU" placeholder="Buscar producto o SKU..." value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filtrar tipo de movimiento" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">Todos los movimientos</option><option value="in">Entradas</option><option value="out">Salidas</option></select><select aria-label="Filtrar por motivo" value={reasonFilter} onChange={event => setReasonFilter(event.target.value)}><option value="all">Todos los motivos</option>{reasons.map(item => <option key={item}>{item}</option>)}</select><label className="movement-date"><CalendarDays size={14}/><input aria-label="Fecha desde" type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} /></label><label className="movement-date"><CalendarDays size={14}/><input aria-label="Fecha hasta" type="date" value={toDate} onChange={event => setToDate(event.target.value)} /></label></div><div className="movement-table-wrap"><table className="movement-table"><thead><tr><th>FECHA Y HORA</th><th>PRODUCTO</th><th>SKU</th><th>TIPO</th><th>MOTIVO</th><th>CANTIDAD</th><th>STOCK ANTERIOR</th><th>STOCK RESULTANTE</th><th>RESPONSABLE</th></tr></thead><tbody>{filteredMovements.map(item => <tr key={item.id}><td>{formatDate(item.date)}</td><td><strong>{item.productName}</strong></td><td className="sku">{item.sku}</td><td><span className={`movement-type ${item.type === 'in' ? 'type-in' : 'type-out'}`}>{item.type === 'in' ? <ArrowDownRight size={13}/> : <ArrowUpRight size={13}/>} {item.type === 'in' ? 'Entrada' : 'Salida'}</span></td><td>{item.reason}{item.reference && <small className="movement-secondary">Ref. {item.reference}</small>}{item.supplier && <small className="movement-secondary">{item.supplier}</small>}</td><td><strong className={item.type === 'in' ? 'quantity-in' : 'quantity-out'}>{item.type === 'in' ? '+' : '−'}{item.quantity}</strong></td><td>{item.previousStock}</td><td>{item.resultingStock}</td><td>{item.responsible}</td></tr>)}</tbody></table>{filteredMovements.length === 0 && <div className="movement-empty"><Boxes size={25}/><strong>{movements.length ? 'No hay movimientos que coincidan' : 'Aún no hay movimientos'}</strong><span>{movements.length ? 'Ajusta la búsqueda o los filtros de fecha y motivo.' : 'Registra una entrada o salida para comenzar el historial.'}</span></div>}</div><div className="movement-table-footer">{filteredMovements.length} {filteredMovements.length === 1 ? 'movimiento' : 'movimientos'}</div></section>{dialog && <MovementDialog type={dialog.type} initialProductId={dialog.productId} products={products} onClose={() => setDialog(null)} onRegister={registerMovement}/>}</div>
}
