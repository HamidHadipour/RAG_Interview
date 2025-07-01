const User = require('./models/User');

async function setup() {
  try {
    console.log('Setting up database...');
    
    // Create all tables
    await User.createTable();
    await User.createConversationsTable();
    await User.createDocumentsTable();
    await User.createMessagesTable();
    
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup(); 