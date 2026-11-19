// PostgreSQL connection module
import pg from 'pg'

const { Pool } = pg

// Database configuration from environment variables
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stockly',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of connections in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
}

// Create a connection pool
const pool = new Pool(dbConfig)

// Test connection function
export async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('✅ Database connected successfully')
    console.log('🕐 Current timestamp:', result.rows[0].now)
    client.release()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

// Query helper function
export async function query(text, params = []) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('📊 Query executed:', { text: text.substring(0, 50) + '...', duration })
    return result
  } catch (error) {
    const duration = Date.now() - start
    console.error('❌ Query failed:', { text: text.substring(0, 50) + '...', duration, error: error.message })
    throw error
  }
}

// Get a client from the pool for transactions
export async function getClient() {
  return await pool.connect()
}

// Close all connections
export async function closePool() {
  try {
    await pool.end()
    console.log('🔌 Database pool closed')
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message)
    throw error
  }
}

export { pool }
