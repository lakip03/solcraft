const { Connection, PublicKey } = require('@solana/web3.js');

async function checkTokenAccount() {
  // Configuration
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const mintAddressStr = process.env.TOKEN_MINT_ADDRESS || 'mntT5ufBMQmHakWRVS5MZLunLz68JJLk2iG5hH1o8F7';

  console.log(`Checking token address: ${mintAddressStr}`);
  console.log(`Using RPC URL: ${rpcUrl}`);

  // Create connection
  const connection = new Connection(rpcUrl, 'confirmed');

  // Check token account
  try {
    // Verify the account exists
    const mintPubkey = new PublicKey(mintAddressStr);
    const accountInfo = await connection.getAccountInfo(mintPubkey);

    if (!accountInfo) {
      console.log('❌ Account does not exist!');
      return;
    }

    console.log('✅ Account exists with data length:', accountInfo.data.length);
    console.log('👤 Owner program:', accountInfo.owner.toString());

    // Check if it matches the Token Program ID
    const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    console.log('🔍 Is owned by Token Program:', accountInfo.owner.equals(tokenProgramId));

    // Log first few bytes of data to see structure
    console.log('📊 Data preview:', Buffer.from(accountInfo.data).toString('hex').substring(0, 50));

  } catch (error) {
    console.error('❌ Error checking token account:', error);
  }
}

// Run the check
checkTokenAccount().catch(console.error);