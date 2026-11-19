import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// PUT /api/products/:id - Update a product
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

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

    // Check if product exists
    const checkResult = await query('SELECT * FROM products WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const { name, sku, description, category, price, cost, stock, min, icon, tone } = body

    const result = await query(
      `UPDATE products
       SET name = $1, sku = $2, description = $3, category = $4,
           price = $5, cost = $6, stock = $7, min_stock = $8,
           icon = $9, tone = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
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
        id,
      ]
    )

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/products/:id - Delete a product
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Check if product exists
    const checkResult = await query('SELECT * FROM products WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id])

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      product: result.rows[0],
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    )
  }
}
