import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/settings - Get business settings
export async function GET() {
  try {
    const result = await query('SELECT * FROM settings LIMIT 1')
    
    // If no settings exist, return default
    if (result.rows.length === 0) {
      return NextResponse.json({
        businessName: 'Stockly',
        businessType: 'Tecnología y electrónica',
        timezone: 'Ciudad de México',
        defaultMinimum: '8',
        showOutOfStock: true,
        lowStockAlerts: true,
        weeklySummary: false,
      })
    }
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update business settings
export async function PUT(request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.businessName || !body.businessType) {
      return NextResponse.json(
        { error: 'Business name and type are required' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO settings (business_name, business_type, timezone, default_minimum, show_out_of_stock, low_stock_alerts, weekly_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         business_name = $1,
         business_type = $2,
         timezone = $3,
         default_minimum = $4,
         show_out_of_stock = $5,
         low_stock_alerts = $6,
         weekly_summary = $7,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        body.businessName,
        body.businessType,
        body.timezone || 'Ciudad de México',
        body.defaultMinimum || '8',
        body.showOutOfStock !== undefined ? body.showOutOfStock : true,
        body.lowStockAlerts !== undefined ? body.lowStockAlerts : true,
        body.weeklySummary !== undefined ? body.weeklySummary : false,
      ]
    )

    return NextResponse.json({
      success: true,
      settings: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    )
  }
}