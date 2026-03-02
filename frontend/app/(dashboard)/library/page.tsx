'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { Modal, PageSpinner, Pagination, ConfirmDialog } from '@/components/ui'
import { PageHeader, StatsCard, EmptyState } from '@/components/shared'
import { usePagination, useDebounce } from '@/hooks'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  BookOpen, Plus, Search, Pencil, Trash2, RotateCcw, Loader2, Library
} from 'lucide-react'

interface Book {
  id: number; title: string; author?: string; isbn?: string; publisher?: string
  category?: string; edition?: string; quantity: number; available_qty: number
  price: number; shelf_location?: string
}

interface BookIssue {
  id: number; book_id: number; student_id?: number; issued_date: string
  due_date: string; return_date?: string; fine_amount: number; status: string
}

const CATEGORIES = ['Textbook','Reference','Fiction','Biography','Science','Mathematics','History','Geography','Other']

const EMPTY_BOOK = {
  title: '', author: '', isbn: '', publisher: '', category: 'Textbook',
  edition: '', quantity: 1, price: 0, shelf_location: '',
}

const EMPTY_ISSUE = { book_id: 0, student_id: '', issued_date: new Date().toISOString().split('T')[0], due_date: '' }

export default function LibraryPage() {
  const [books,   setBooks]   = useState<Book[]>([])
  const [issues,  setIssues]  = useState<BookIssue[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [tab,     setTab]     = useState<'books' | 'issues'>('books')
  const [search,  setSearch]  = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [showIssue,  setShowIssue]  = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [selected,   setSelected]   = useState<Book | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<BookIssue | null>(null)
  const [confirm,  setConfirm] = useState<number | null>(null)
  const [saving,   setSaving]  = useState(false)
  const [form,     setForm]    = useState({ ...EMPTY_BOOK })
  const [issueForm, setIssueForm] = useState<any>({ ...EMPTY_ISSUE })

  const debouncedSearch = useDebounce(search)
  const { page, perPage, setPage, reset, totalPages } = usePagination(15)

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (catFilter)        params.category = catFilter
      if (debouncedSearch)  params.search   = debouncedSearch
      const res = await api.get('/library/books', { params })
      setBooks(res.data.books || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await api.get('/library/issues')
      setIssues(res.data)
    } catch {
      setIssues([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'books') fetchBooks()
    else fetchIssues()
  }, [tab, page, catFilter, debouncedSearch])

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/library/books', form)
      toast.success('Book added!')
      setShowModal(false)
      setForm({ ...EMPTY_BOOK })
      fetchBooks()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueForm.book_id) { toast.error('Select a book'); return }
    setSaving(true)
    try {
      await api.post('/library/issues', {
        ...issueForm,
        student_id: issueForm.student_id ? parseInt(issueForm.student_id) : null,
      })
      toast.success('Book issued!')
      setShowIssue(false)
      setIssueForm({ ...EMPTY_ISSUE })
      if (tab === 'issues') fetchIssues()
      fetchBooks()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Issue failed')
    } finally {
      setSaving(false)
    }
  }

  const handleReturnBook = async () => {
    if (!selectedIssue) return
    setSaving(true)
    try {
      await api.patch(`/library/issues/${selectedIssue.id}/return`, {
        return_date: new Date().toISOString().split('T')[0],
        fine_amount: 0,
      })
      toast.success('Book returned!')
      setShowReturn(false)
      setSelectedIssue(null)
      fetchIssues()
      fetchBooks()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Return failed')
    } finally {
      setSaving(false)
    }
  }

  const totalBooks     = books.reduce((a, b) => a + b.quantity, 0)
  const availableBooks = books.reduce((a, b) => a + b.available_qty, 0)
  const issuedCount    = issues.filter(i => !i.return_date).length

  return (
    <>
      <Navbar title="Library" />
      <div className="p-6 space-y-5">

        <PageHeader title="Library Management" subtitle="Manage books and issue records">
          <button onClick={() => setShowIssue(true)} className="btn-secondary">
            <BookOpen className="w-4 h-4" /> Issue Book
          </button>
          <button onClick={() => { setForm({ ...EMPTY_BOOK }); setShowModal(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Book
          </button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Total Books"     value={totalBooks}     icon={BookOpen} color="bg-blue-500"   />
          <StatsCard label="Available"       value={availableBooks} icon={Library}  color="bg-green-500"  />
          <StatsCard label="Currently Issued" value={issuedCount}   icon={BookOpen} color="bg-orange-500" />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {(['books','issues'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors
                  ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'books' ? '📚 Books Catalog' : '📋 Issue Records'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'books' && (
          <>
            <div className="card !p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Search books by title, author..." value={search} onChange={e => { setSearch(e.target.value); reset() }} />
              </div>
              <select className="input sm:w-44" value={catFilter} onChange={e => { setCatFilter(e.target.value); reset() }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="card !p-0 overflow-hidden">
              {loading ? <div className="py-16"><PageSpinner /></div> :
              books.length === 0 ? (
                <EmptyState icon={BookOpen} title="No books in catalog" message="Add your first book to the library." action={{ label: 'Add Book', onClick: () => setShowModal(true) }} />
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {['Title','Author','ISBN','Category','Total','Available','Price','Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {books.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                              <span className="font-medium text-gray-900 max-w-xs truncate">{b.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{b.author || '—'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.isbn || '—'}</td>
                          <td className="px-4 py-3"><span className="badge-blue">{b.category || '—'}</span></td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{b.quantity}</td>
                          <td className="px-4 py-3">
                            <span className={b.available_qty > 0 ? 'badge-green' : 'badge-red'}>{b.available_qty}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{formatCurrency(b.price)}</td>
                          <td className="px-4 py-3">
                            <button
                              disabled={b.available_qty === 0}
                              onClick={() => { setIssueForm({ ...EMPTY_ISSUE, book_id: b.id }); setShowIssue(true) }}
                              className="btn-primary !py-1 !text-xs disabled:opacity-40"
                            >
                              Issue
                            </button>
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

        {tab === 'issues' && (
          <div className="card !p-0 overflow-hidden">
            {loading ? <div className="py-16"><PageSpinner /></div> :
            issues.length === 0 ? (
              <EmptyState icon={BookOpen} title="No issue records" message="Issue records will appear here." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Book ID','Student','Issued','Due Date','Return Date','Fine','Status','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {issues.map(i => (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600">Book #{i.book_id}</td>
                      <td className="px-4 py-3 text-gray-600">{i.student_id ? `#${i.student_id}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(i.issued_date)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(i.due_date)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{i.return_date ? formatDate(i.return_date) : '—'}</td>
                      <td className="px-4 py-3 text-red-600">{i.fine_amount > 0 ? formatCurrency(i.fine_amount) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={i.status === 'issued' ? 'badge-yellow' : i.status === 'returned' || i.return_date ? 'badge-green' : 'badge-blue'}>
                          {i.return_date ? 'returned' : i.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!i.return_date && (
                          <button onClick={() => { setSelectedIssue(i); setShowReturn(true) }}
                            className="btn-secondary !py-1 !text-xs flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Book"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button form="book-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Book</>}
            </button>
          </>
        }
      >
        <form id="book-form" onSubmit={handleSaveBook} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Book Title *</label>
              <input className="input" value={form.title} onChange={e => setF('title', e.target.value)} required />
            </div>
            <div>
              <label className="label">Author</label>
              <input className="input" value={form.author} onChange={e => setF('author', e.target.value)} />
            </div>
            <div>
              <label className="label">ISBN</label>
              <input className="input" value={form.isbn} onChange={e => setF('isbn', e.target.value)} />
            </div>
            <div>
              <label className="label">Publisher</label>
              <input className="input" value={form.publisher} onChange={e => setF('publisher', e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setF('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" className="input" min="1" value={form.quantity} onChange={e => setF('quantity', parseInt(e.target.value))} required />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" className="input" value={form.price} onChange={e => setF('price', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="label">Shelf Location</label>
              <input className="input" value={form.shelf_location} onChange={e => setF('shelf_location', e.target.value)} placeholder="e.g. A-1-3" />
            </div>
            <div>
              <label className="label">Edition</label>
              <input className="input" value={form.edition} onChange={e => setF('edition', e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Issue Book Modal */}
      <Modal
        open={showIssue}
        onClose={() => setShowIssue(false)}
        title="Issue Book"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowIssue(false)} className="btn-secondary">Cancel</button>
            <button form="issue-form" type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</> : 'Issue Book'}
            </button>
          </>
        }
      >
        <form id="issue-form" onSubmit={handleIssueBook} className="space-y-4">
          <div>
            <label className="label">Book ID *</label>
            <input type="number" className="input" value={issueForm.book_id || ''} onChange={e => setIssueForm((f: any) => ({ ...f, book_id: parseInt(e.target.value) }))} required />
          </div>
          <div>
            <label className="label">Student ID</label>
            <input type="number" className="input" value={issueForm.student_id} onChange={e => setIssueForm((f: any) => ({ ...f, student_id: e.target.value }))} placeholder="Leave empty for staff" />
          </div>
          <div>
            <label className="label">Issue Date *</label>
            <input type="date" className="input" value={issueForm.issued_date} onChange={e => setIssueForm((f: any) => ({ ...f, issued_date: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input type="date" className="input" value={issueForm.due_date} onChange={e => setIssueForm((f: any) => ({ ...f, due_date: e.target.value }))} required />
          </div>
        </form>
      </Modal>

      {/* Return Confirm */}
      <ConfirmDialog
        open={showReturn}
        onClose={() => setShowReturn(false)}
        onConfirm={handleReturnBook}
        title="Return Book"
        message={`Mark book #${selectedIssue?.book_id} as returned? Any fine will be calculated automatically.`}
        confirmLabel="Confirm Return"
        variant="info"
        loading={saving}
      />
    </>
  )
}
