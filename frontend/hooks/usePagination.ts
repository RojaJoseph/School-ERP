import { useState, useCallback } from 'react'

export function usePagination(initialPerPage = 10) {
  const [page, setPage]       = useState(1)
  const [perPage]             = useState(initialPerPage)

  const reset = useCallback(() => setPage(1), [])

  const totalPages = (total: number) => Math.ceil(total / perPage)

  return { page, perPage, setPage, reset, totalPages }
}
