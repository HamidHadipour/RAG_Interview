# GenAI RAG Chatbot with Authentication

A RAG (Retrieval-Augmented Generation) chatbot system with user authentication that can read CSV, PDF, and text files and answer questions about them.

## Features

- 🔐 User authentication with email and password
- 📄 Document upload (PDF, CSV, DOCX)
- 💬 Interactive chat interface
- 🔍 RAG-based question answering
- 🗄️ SQLite database for user management
- 🎨 Modern, responsive UI
- 🗄️ Pinecone Vectore DB

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd RAG_Interview
```



### 2. Install Dependencies

Install server dependencies:
```bash
cd server
npm install
```

Install client dependencies:
```bash
cd ../client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:
```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=rag_chatbot
DB_PASSWORD=your_password
DB_PORT=5432

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API Key (if you have one)
OPENAI_API_KEY=your-openai-api-key-here

# Pinecone Configuration (if you have one)
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=your-pinecone-environment-here
```

### 4. Initialize Database

Run the setup script to create the users table:
```bash
cd server
node setup.js
```

## Running the Application

### Start the Server
```bash
cd server
npm start
```

The server will run on `http://localhost:5000`

### Start the Client
```bash
cd client
npm start
```

The client will run on `http://localhost:3000`

## Usage

1. **Register/Login**: First-time users need to register with an email and password
2. **Upload Documents**: Upload PDF, CSV, or DOCX files to the system
3. **Ask Questions**: Use the chat interface to ask questions about your uploaded documents
4. **Logout**: Click the logout button to end your session

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Document Management
- `POST /api/upload` - Upload and process documents (requires auth)

### Chat
- `POST /api/chat` - Ask questions about documents (requires auth)

## Project Structure

```
genai-chatbot-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Login.js    # Login component
│   │   │   ├── Register.js # Registration component
│   │   │   ├── Chatbot.js  # Main chatbot interface
│   │   │   ├── Auth.css    # Authentication styles
│   │   │   └── Chatbot.css # Chatbot styles
│   │   └── App.js          # Main app component
├── server/                 # Node.js backend
│   ├── config/
│   │   └── database.js     # Database configuration
│   ├── models/
│   │   └── User.js         # User model
│   ├── middleware/
│   │   └── auth.js         # Authentication middleware
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── upload.js       # File upload routes
│   │   └── chat.js         # Chat routes
│   ├── services/           # RAG services
│   ├── uploads/            # Uploaded files
│   ├── setup.js            # Database setup script
│   └── index.js            # Server entry point
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API endpoints
- Input validation
- Session management

## Technologies Used

### Backend
- Node.js
- Express.js
- SQLite
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- express-fileupload (file handling)

### Frontend
- React
- Axios (HTTP client)
- CSS3 (styling)

### Limitations
- cannot read huge files like 100KB in size
- The database is SQLite, which is just for the demo.
- It is using GPT3.5-turbo that can be upgraded to production-ready.
- The model cannot analyze images.
- The authentication is not aligned with Google, Apple, and Meta logins, plus it's not fully utilized by having services like forget password.  

## License

This project is licensed under the MIT License. 
