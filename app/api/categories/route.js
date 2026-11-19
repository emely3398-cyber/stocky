import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/categories - List all categories
export async function GET() {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name ASC')
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Check if category already exists
    const existing = await query('SELECT * FROM categories WHERE name = $1', [body.name])
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      )
    }

    const result = await query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [body.name]
    )

    return NextResponse.json({
      success: true,
      category: result.rows[0],
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category', details: error.message },
      { status: 500 }
    )
  }
}