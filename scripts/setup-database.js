require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    const testResult = await sql`SELECT NOW() as current_time;`;
    console.log('✅ Database connection successful:', testResult.rows[0]);

    // Create token_metadata table
    console.log('📋 Creating token_metadata table...');
    await sql`
      CREATE TABLE IF NOT EXISTS token_metadata (
        id SERIAL PRIMARY KEY,
        pool_address VARCHAR(42) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        image_url TEXT,
        description TEXT,
        website VARCHAR(255),
        telegram VARCHAR(255),
        twitter VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ token_metadata table created/verified');

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_token_metadata_pool_address
      ON token_metadata(pool_address);
    `;
    console.log('✅ Index created/verified');

    // Check if table has data
    const countResult = await sql`SELECT COUNT(*) as count FROM token_metadata;`;
    console.log('📊 Current records in token_metadata:', countResult.rows[0].count);

    // Show all records
    const allRecords = await sql`SELECT * FROM token_metadata ORDER BY created_at DESC;`;
    console.log('📋 All records:', allRecords.rows);

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.message.includes('missing_connection_string')) {
      console.error('💡 Make sure you have POSTGRES_URL in your .env file');
    }
  }
}

setupDatabase(); 