import { NextResponse } from 'next/server'
import { query, getClient } from '@/lib/db'

// GET /api/movements - List all movements
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build query
    let queryText = `
      SELECT m.*, p.name as product_name, p.sku as product_sku
      FROM movements m
      JOIN products p ON m.product_id = p.id
      WHERE 1=1
    `
    const params = []
    let paramIndex = 1

    if (type && type !== 'all') {
      queryText += ` AND m.type = $${paramIndex++}`
      params.push(type)
    }

    if (productId) {
      queryText += ` AND m.product_id = $${paramIndex++}`
      params.push(productId)
    }

    if (fromDate) {
      queryText += ` AND DATE(m.date) >= $${paramIndex++}`
      params.push(fromDate)
    }

    if (toDate) {
      queryText += ` AND DATE(m.date) <= $${paramIndex++}`
      params.push(toDate)
    }

    queryText += ` ORDER BY m.date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limit, offset)

    const result = await query(queryText, params)

    // Get total count
    let countQueryText = `
      SELECT COUNT(*) FROM movements m
      JOIN products p ON m.product_id = p.id
      WHERE 1=1
    `
    const countParams = []
    let countParamIndex = 1

    if (type && type !== 'all') {
      countQueryText += ` AND m.type = $${countParamIndex++}`
      countParams.push(type)
    }

    if (productId) {
      countQueryText += ` AND m.product_id = $${countParamIndex++}`
      countParams.push(productId)
    }

    if (fromDate) {
      countQueryText += ` AND DATE(m.date) >= $${countParamIndex++}`
      countParams.push(fromDate)
    }

    if (toDate) {
      countQueryText += ` AND DATE(m.date) <= $${countParamIndex++}`
      countParams.push(toDate)
    }

    const countResult = await query(countQueryText, countParams)
    const total = parseInt(countResult.rows[0].count)

    return NextResponse.json({
      movements: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movements', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/movements - Register a movement
export async function POST(request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.productId || !body.type || !body.quantity || !body.date) {
      return NextResponse.json(
        { error: 'Product ID, type, quantity, and date are required fields' },
        { status: 400 }
      )
    }

    if (!['in', 'out'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Type must be either "in" or "out"' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(parseInt(body.quantity)) || parseInt(body.quantity) <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer' },
        { status: 400 }
      )
    }

    const client = await getClient()

    try {
      await client.query('BEGIN')

      // Check current stock
      const productResult = await client.query(
        'SELECT stock FROM products WHERE id = $1 FOR UPDATE',
        [body.productId]
      )

      if (productResult.rows.length === 0) {
        throw new Error('Product not found')
      }

      const currentStock = productResult.rows[0].stock

      // Check if enough stock for outgoing movement
      if (body.type === 'out' && body.quantity > currentStock) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${body.quantity}`)
      }

      // Calculate new stock
      const newStock = currentStock + (body.type === 'in' ? body.quantity : -body.quantity)

      // Update product stock
      await client.query(
        'UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, body.productId]
      )

      // Insert movement record
      const movementResult = await client.query(
        'INSERT INTO movements (product_id, type, quantity, date, reason, supplier, reference, responsible, notes, previous_stock, resulting_stock, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        [
          body.productId,
          body.type,
          body.quantity,
          body.date,
          body.reason || (body.type === 'in' ? 'Entrada' : 'Otro motivo'),
          body.supplier || null,
          body.reference || null,
          body.responsible || null,
          body.notes || null,
          currentStock,
          newStock,
          'api'
        ]
      )

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        movement: movementResult.rows[0],
        newStock: newStock,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error registering movement:', error)
    return NextResponse.json(
      { error: 'Failed to register movement', details: error.message },
      { status: 500 }
    )
  }
}