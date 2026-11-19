import { NextResponse } from 'next/server'
import { query, getClient } from '@/lib/db'

// GET /api/products - List all products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build query
    let queryText = 'SELECT * FROM products WHERE 1=1'
    const params = []

    if (category && category !== 'All categories') {
      queryText += ' AND category = $1'
      params.push(category)
    }

    if (search) {
      queryText += ' AND (name ILIKE $' + (params.length + 1) + ' OR sku ILIKE $' + (params.length + 1) + ')'
      params.push(`%${search}%`)
    }

    // Add sorting
    if (sort === 'price') {
      queryText += ' ORDER BY price ASC'
    } else if (sort === 'name') {
      queryText += ' ORDER BY name ASC'
    } else if (sort === 'stock') {
      queryText += ' ORDER BY stock ASC'
    } else {
      queryText += ' ORDER BY id ASC'
    }

    queryText += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(limit, offset)

    const result = await query(queryText, params)

    // Get total count
    let countQueryText = 'SELECT COUNT(*) FROM products WHERE 1=1'
    const countParams = []

    if (category && category !== 'All categories') {
      countQueryText += ' AND category = $1'
      countParams.push(category)
    }

    if (search) {
      countQueryText += ' AND (name ILIKE $' + (countParams.length + 1) + ' OR sku ILIKE $' + (countParams.length + 1) + ')'
      countParams.push(`%${search}%`)
    }

    const countResult = await query(countQueryText, countParams)
    const total = parseInt(countResult.rows[0].count)

    return NextResponse.json({
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.sku) {
      return NextResponse.json(
        { error: 'Name and SKU are required fields' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (body.price && isNaN(parseFloat(body.price))) {
      return NextResponse.json(
        { error: 'Price must be a valid number' },
        { status: 400 }
      )
    }

    if (body.stock && isNaN(parseInt(body.stock))) {
      return NextResponse.json(
        { error: 'Stock must be a valid integer' },
        { status: 400 }
      )
    }

    // Set default values
    const { name, sku, description, category, price, cost, stock, min, icon, tone } = body

    const result = await query(
      `INSERT INTO products (name, sku, description, category, price, cost, stock, min_stock, icon, tone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        sku,
        description || null,
        category || 'Periféricos',
        parseFloat(price) || 0,
        parseFloat(cost) || null,
        parseInt(stock) || 0,
        parseInt(min) || 8,
        icon || 'Package',
        tone || 'violet',
      ]
    )

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product', details: error.message },
      { status: 500 }
    )
  }
}
