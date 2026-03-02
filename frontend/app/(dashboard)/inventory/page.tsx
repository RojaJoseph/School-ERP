'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner, Pagination, ConfirmDialog } from '@/components/ui'
import { PageHeader, StatsCard, EmptyState } from '@/components/shared'
import { usePagination, useDebounce } from '@/hooks'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Package, Plus, AlertTriangle, Search, ArrowUpCircle, ArrowDownCircle, Loader2
} from 'lucide-react'

interface InventoryItem {
  id: number; item_code: string; name: string; category?: string
  quantity: number; min_stock: number; unit_price: number; unit?: string; location?: string
}

interface Transaction {
  id: number; item_id: number; transaction_type: string
  quantity: number; total_price: number; created_at: string; remarks?: string
}

const CATEGORIES   = ['Stationery','Electronics','Furniture','Sports','Lab Equipment','Cleaning','Other']
const TRANS_TYPES  = ['purchase','issued','returned','damaged','disposed']

const EMPTY_ITEM = {
  item_code: '', name: '', category: 'Stationery', description: '',
  unit: 'pcs', quantity: 0, min_stock: 10, unit_price: 0, location: '',
}

const EMPTY_TRANS = { item_id: 0, transaction_type: 'purchase', quantity: 1, unit_price: 0, remarks: '' }

export default function InventoryPage() {
  const [items,    setItems]    = useState<InventoryItem[]>([])
  const [trans,    setTrans]    = useState<Transaction[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [tab,      setTab]      = useState<'items' | 'transactions'>('items')
  const [search,   setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [lowStock,  setLowStock]  = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [showTrans,  setShowTrans]  = useState(false)
  const [confirm,    setConfirm]    = useState<number | null>(null)
  const [saving,     setSaving]    = useState(false)
  const [form,       setForm]      = useState({ ...EMPTY_ITEM })
  const [transForm,  setTransForm] = useState<any>({ ...EMPTY_TRANS })

  const debouncedSearch = useDebounce(search)
  const { page, perPage, setPage, reset, totalPages } = usePagination(15)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (catFilter)       params.category  = catFilter
      if (lowStock)        params.low_stock = true
      const res = await api.get('/inventory/items', { params })
      let list: InventoryItem[] = res.data.items || []
      if (debouncedSearch) {
        list = list.filter(i =>
          i.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          i.item_code.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }
      setItems(list)
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/inventory/transactions', { params: { page, per_page: perPage } })
      setTrans(res.data.transactions || res.data)
    } catch {
      setTrans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'items') fetchItems()
    else fetchTransactions()
  }, [tab, page, catFilter, lowStock, debouncedSearch])

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/items', form)
      toast.success('Item added!')
      setShowModal(false)
      setForm({ ...EMPTY_ITEM })
      fetchItems()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/transactions', transForm)
      toast.success('Transaction recorded!')
      setShowTrans(false)
      setTransForm({ ...EMPTY_TRANS })
      fetchItems()
      if (tab === 'transactions') fetchTransactions()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Transaction failed')
    } finally {
      setSaving(false)
    }
  }

  const lowStockItems = items.filter(i => i.quantity <= i.min_stock)
  const totalValue    = items.reduce((a, i) => a + i.quantity * i.unit_price, 0)

  const transTypeBadge = (t: string) => {
    const m: any = {
      purchase: 'badge-green',
      issued:   'badge-yellow',
      returned: 'badge-blue',
      damaged:  'badge-red',
      disposed: 'bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium',
    }
    return m[t] || 'badge-blue'
  }

  return (
    <>
      <Navbar title="Inventory" />
      <div className="p-6 space-y-5">

        <PageHeader title="Inventory Management" subtitle="Track stock, assets and transactions">
          <button onClick={() => { setTransForm({ ...EMPTY_TRANS }); setShowTrans(true) }} className="btn-secondary">
            <Package className="w-4 h-4" /> Add Transaction
          </button>
          <button onClick={() => { setForm({ ...EMPTY_ITEM }); setShowModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Total Items"   value={total}                   icon={Package}       color="bg-blue-500"   />
          <StatsCard label="Low Stock"     value={lowStockItems.length}    icon={AlertTriangle} color="bg-red-500"    />
          <StatsCard label="Total Value"   value={formatCurrency(totalValue)} icon={Package}   color="bg-green-500"  />
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Low Stock Alert! ({lowStockItems.length} items)</p>
              <p className="text-sm text-yellow-700 mt-0.5">{lowStockItems.slice(0,3).map(i => i.name).join(', ')}{lowStockItems.length > 3 ? ` and ${lowStockItems.length-3} more` : ''}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {(['items','transactions'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'items' ? '📦 Items' : '🔄 Transactions'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'items' && (
          <>
            <div className="card !p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Search items..." value={search} onChange={e => { setSearch(e.target.value); reset() }} />
              </div>
              <select className="input sm:w-44" value={catFilter} onChange={e => { setCatFilter(e.target.value); reset() }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={lowStock} onChange={e => { setLowStock(e.target.checked); reset() }} className="rounded" />
                <span className="text-sm text-gray-600">Low Stock Only</span>
              </label>
            </div>

            <div className="card !p-0 overflow-hidden">
              {loading ? <div className="py-16"><PageSpinner /></div> :
              items.length === 0 ? (
                <EmptyState icon={Package} title="No items in inventory" message="Add your first inventory item." action={{ label: 'Add Item', onClick: () => setShowModal(true) }} />
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {['Code','Item Name','Category','Qty','Min Stock','Unit Price','Total Value','Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map(i => (
                        <tr key={i.id} className={`hover:bg-gray-50 ${i.quantity <= i.min_stock ? 'bg-red-50/20' : ''}`}>
                          <td className="px-4 py-3 font-mono text-blue-600 text-xs">{i.item_code}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{i.name}</p>
                              <p className="text-xs text-gray-400">{i.location || '—'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="badge-blue">{i.category || '—'}</span></td>
                          <td className={`px-4 py-3 font-bold ${i.quantity <= i.min_stock ? 'text-red-600' : 'text-gray-900'}`}>{i.quantity}</td>
                          <td className="px-4 py-3 text-gray-500">{i.min_stock}</td>
                          <td className="px-4 py-3 text-gray-700">{formatCurrency(i.unit_price)}</td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(i.quantity * i.unit_price)}</td>
                          <td className="px-4 py-3">
                            <span className={i.quantity <= i.min_stock ? 'badge-red' : i.quantity <= i.min_stock * 1.5 ? 'badge-yellow' : 'badge-green'}>
                              {i.quantity <= i.min_stock ? '⚠ Low' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={page} totalPages={totalPages(total)} total={total} perPage={perPage} onPageChange={setPage} />
                </>
              )}
            </div>
          </>
        )}

        {tab === 'transactions' && (
          <div className="card !p-0 overflow-hidden">
            {loading ? <div className="py-16"><PageSpinner /></div> :
            trans.length === 0 ? (
              <EmptyState icon={Package} title="No transactions yet" message="Record a purchase or issue to see transactions." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Item','Type','Qty','Total Price','Date','Remarks'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trans.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600">Item #{t.item_id}</td>
                      <td className="px-4 py-3">
                        <span className={transTypeBadge(t.transaction_type)}>{t.transaction_type}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <span className={t.transaction_type === 'purchase' || t.transaction_type === 'returned' ? 'text-green-600' : 'text-red-600'}>
                          {t.transaction_type === 'purchase' || t.transaction_type === 'returned' ? '+' : '-'}{t.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(t.total_price)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(t.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{t.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Inventory Item"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button form="item-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Item</>}
            </button>
          </>
        }
      >
        <form id="item-form" onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Item Code *</label>
              <input className="input" value={form.item_code} onChange={e => setF('item_code', e.target.value)} required />
            </div>
            <div>
              <label className="label">Item Name *</label>
              <input className="input" value={form.name} onChange={e => setF('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setF('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={e => setF('unit', e.target.value)}>
                {['pcs','kg','ltr','box','ream','set'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Initial Quantity *</label>
              <input type="number" className="input" min="0" value={form.quantity} onChange={e => setF('quantity', parseInt(e.target.value))} required />
            </div>
            <div>
              <label className="label">Minimum Stock Level *</label>
              <input type="number" className="input" min="0" value={form.min_stock} onChange={e => setF('min_stock', parseInt(e.target.value))} required />
            </div>
            <div>
              <label className="label">Unit Price (₹) *</label>
              <input type="number" className="input" value={form.unit_price} onChange={e => setF('unit_price', parseFloat(e.target.value))} required />
            </div>
            <div>
              <label className="label">Storage Location</label>
              <input className="input" value={form.location} onChange={e => setF('location', e.target.value)} placeholder="e.g. Storeroom A" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        open={showTrans}
        onClose={() => setShowTrans(false)}
        title="Record Transaction"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowTrans(false)} className="btn-secondary">Cancel</button>
            <button form="trans-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Record'}
            </button>
          </>
        }
      >
        <form id="trans-form" onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="label">Item ID *</label>
            <input type="number" className="input" value={transForm.item_id || ''} onChange={e => setTransForm((f: any) => ({ ...f, item_id: parseInt(e.target.value) }))} required />
          </div>
          <div>
            <label className="label">Transaction Type *</label>
            <select className="input" value={transForm.transaction_type} onChange={e => setTransForm((f: any) => ({ ...f, transaction_type: e.target.value }))}>
              {TRANS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input type="number" className="input" min="1" value={transForm.quantity} onChange={e => setTransForm((f: any) => ({ ...f, quantity: parseInt(e.target.value) }))} required />
          </div>
          <div>
            <label className="label">Unit Price (₹)</label>
            <input type="number" className="input" value={transForm.unit_price} onChange={e => setTransForm((f: any) => ({ ...f, unit_price: parseFloat(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={transForm.remarks} onChange={e => setTransForm((f: any) => ({ ...f, remarks: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </>
  )
}
