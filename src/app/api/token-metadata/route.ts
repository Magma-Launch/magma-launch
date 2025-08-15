import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, name, symbol, imageUrl, description, website, telegram, twitter } = body;

    if (!contractAddress || !name || !symbol) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalize address to lowercase for consistent storage
    const normalizedAddress = contractAddress.toLowerCase();

    // Insert or update token metadata in database
    const result = await sql`
      INSERT INTO token_metadata (pool_address, name, symbol, image_url, description, website, telegram, twitter, updated_at)
      VALUES (${normalizedAddress}, ${name}, ${symbol}, ${imageUrl || null}, ${description || null}, ${website || null}, ${telegram || null}, ${twitter || null}, CURRENT_TIMESTAMP)
      ON CONFLICT (pool_address) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        symbol = EXCLUDED.symbol,
        image_url = EXCLUDED.image_url,
        description = EXCLUDED.description,
        website = EXCLUDED.website,
        telegram = EXCLUDED.telegram,
        twitter = EXCLUDED.twitter,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    console.log('✅ Stored metadata in database for:', normalizedAddress);
    console.log('📦 Database result:', result.rows[0]);

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Save metadata error:', error);
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('address');
    const debug = searchParams.get('debug');

    // Debug endpoint to see all stored metadata
    if (debug === 'true') {
      const result = await sql`SELECT * FROM token_metadata ORDER BY created_at DESC;`;
      console.log('🐛 Debug: All stored metadata:', result.rows);
      return NextResponse.json({ 
        debug: true, 
        allMetadata: result.rows,
        count: result.rows.length 
      });
    }

    if (!contractAddress) {
      return NextResponse.json({ error: 'Contract address required' }, { status: 400 });
    }

    console.log('🔍 Fetching metadata from database for:', contractAddress);
    
    // Try exact case first, then lowercase as fallback
    let result = await sql`
      SELECT * FROM token_metadata 
      WHERE pool_address = ${contractAddress} 
      LIMIT 1;
    `;
    
    // If not found with exact case, try lowercase
    if (result.rows.length === 0) {
      const normalizedAddress = contractAddress.toLowerCase();
      console.log('🔄 Trying lowercase lookup for:', normalizedAddress);
      result = await sql`
        SELECT * FROM token_metadata 
        WHERE pool_address = ${normalizedAddress} 
        LIMIT 1;
      `;
    }
    
    if (result.rows.length === 0) {
      console.log('❌ Metadata not found in database for:', contractAddress);
      return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
    }

    const metadata = result.rows[0];
    console.log('✅ Found metadata in database:', metadata);
    
    // Return in the expected format
    return NextResponse.json({
      name: metadata.name,
      symbol: metadata.symbol,
      imageUrl: metadata.image_url,
      description: metadata.description,
      website: metadata.website,
      telegram: metadata.telegram,
      twitter: metadata.twitter
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    return NextResponse.json({ error: 'Failed to get metadata' }, { status: 500 });
  }
} 