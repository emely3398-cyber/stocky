// Applies scripts/schema.sql to the configured PostgreSQL database.
// It only creates tables, indexes and views. It does NOT insert sample data.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stockly',
  password: process.env.DB_PASSWORD || 'password',
  port: Number(process.env.DB_PORT || 5432),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

async function initDb() {
  const client = await pool.connect()
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    await client.query(schema)
    console.log('Esquema de Stockly aplicado correctamente.')
  } finally {
    client.release()
    await pool.end()
  }
}

initDb().catch((error) => {
  console.error('No se pudo inicializar la base de datos:', error.message)
  process.exitCode = 1
})
