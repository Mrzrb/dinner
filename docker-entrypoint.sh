#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Checking if seed data needs to be imported..."
if [ -f prisma/seed.sql ]; then
  # Check if User table has data
  USER_COUNT=$(node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('SELECT COUNT(*) FROM \"User\"')
      .then(r => { console.log(r.rows[0].count); pool.end(); })
      .catch(() => { console.log('0'); pool.end(); });
  ")
  if [ "$USER_COUNT" = "0" ]; then
    echo "Empty database, importing seed data..."
    node -e "
      const { Pool } = require('pg');
      const fs = require('fs');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const sql = fs.readFileSync('prisma/seed.sql', 'utf8');
      pool.query(sql)
        .then(() => { console.log('Seed data imported successfully'); pool.end(); })
        .catch(e => { console.error('Seed error:', e.message); pool.end(); });
    "
  else
    echo "Database already has data, skipping seed."
  fi
fi

echo "Starting Next.js server..."
exec node server.js
