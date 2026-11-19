// API client utility for Next.js API routes.
// It adapts PostgreSQL snake_case columns to the camelCase shape used by the UI.

const API_BASE_URL = '/api'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Convert a database row into the shape the components expect
function toProduct(row) {
  if (!row) return null
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description || '',
    category: row.category,
    price: Number(row.price),
    cost: row.cost == null ? '' : Number(row.cost),
    stock: Number(row.stock),
    min: Number(row.min_stock),
    icon: row.icon || 'Package',
    tone: row.tone || 'violet',
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
  }

  const config = { ...defaultOptions, ...options }
  config.headers = { ...defaultOptions.headers, ...options.headers }

  let response
  try {
    response = await fetch(url, config)
  } catch (error) {
    throw new ApiError(`Network error: ${error.message}`, 0, { originalError: error })
  }

  let data
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `HTTP error! status: ${response.status}`,
      response.status,
      data
    )
  }

  return data
}

export const api = {
  products: {
    getAll: async (params) => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString())
          }
        })
      }
      const queryString = searchParams.toString()
      const response = await apiRequest(`/products${queryString ? '?' + queryString : ''}`)
      return {
        products: (response.products || []).map(toProduct),
        pagination: response.pagination,
      }
    },

    create: async (data) => {
      const response = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return toProduct(response.product)
    },

    update: async (id, data) => {
      const response = await apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return toProduct(response.product)
    },

    delete: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  },
}

export { ApiError }
