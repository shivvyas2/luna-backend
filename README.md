# Luna Backend

Express.js backend API with Clerk authentication and Swagger UI documentation.

## Features

- 🔐 Clerk authentication integration
- 📚 Swagger UI API documentation
- 🚀 Express.js REST API
- 📱 Support for email and phone number authentication
- 🔒 Protected routes with authentication middleware

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Clerk account and API keys

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your Clerk credentials:

```bash
cp .env.example .env.local
```

Get your Clerk API keys from the [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys):
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

```env
CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
PORT=3000
NODE_ENV=development
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env.local`).

## API Documentation

Once the server is running, access Swagger UI at:

```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890" // optional
}
```

#### POST `/api/auth/login`
**Note:** In production, authentication should be handled by Clerk's frontend SDK. This endpoint is for reference only.

#### GET `/api/auth/profile`
Get the authenticated user's profile. Requires authentication token in the Authorization header.

**Headers:**
```
Authorization: Bearer YOUR_SESSION_TOKEN
```

### Health Check

#### GET `/health`
Check if the server is running.

## Authentication Flow

1. **Frontend Integration**: Use Clerk's frontend SDK (e.g., `@clerk/nextjs` for Next.js) to handle user sign-in and sign-up.

2. **Session Token**: After authentication on the frontend, Clerk provides a session token.

3. **API Requests**: Include the session token in the Authorization header:
   ```
   Authorization: Bearer YOUR_SESSION_TOKEN
   ```

4. **Protected Routes**: Routes protected with `requireAuth()` middleware will automatically verify the token and provide user information via `getAuth(req)`.

## Testing with Swagger UI

1. Start the server
2. Navigate to `http://localhost:3000/api-docs`
3. Click the "Authorize" button
4. Enter your Clerk session token (obtained from frontend authentication)
5. Test the protected endpoints

## Deployment to Vercel

This backend is configured for easy deployment to Vercel, making it accessible remotely for your mobile or web app.

### Prerequisites

- Vercel account ([sign up here](https://vercel.com))
- Vercel CLI (optional, for command-line deployment)

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (or GitLab/Bitbucket)

2. **Import project to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your repository

3. **Configure Environment Variables:**
   - In the Vercel project settings, go to "Environment Variables"
   - Add the following variables:
     - `CLERK_PUBLISHABLE_KEY` = Your Clerk Publishable Key
     - `CLERK_SECRET_KEY` = Your Clerk Secret Key
     - `NODE_ENV` = `production`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically detect the Express app and deploy it

5. **Access your API:**
   - Your API will be available at `https://your-project-name.vercel.app`
   - Swagger UI: `https://your-project-name.vercel.app/api-docs`

#### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts to complete deployment.

4. **Set Environment Variables:**
   ```bash
   vercel env add CLERK_PUBLISHABLE_KEY
   vercel env add CLERK_SECRET_KEY
   vercel env add NODE_ENV
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Important Notes for Vercel Deployment

- **Serverless Functions**: The app runs as serverless functions on Vercel
- **Cold Starts**: First request after inactivity may have a slight delay
- **Environment Variables**: Must be set in Vercel dashboard, not in `.env` files
- **CORS**: Update CORS settings in your frontend to allow requests from your Vercel domain
- **API Base URL**: Use your Vercel deployment URL as the base URL for API calls

### Updating Your Frontend

After deployment, update your frontend to use the Vercel URL:

```javascript
// Example: Update your API base URL
const API_BASE_URL = 'https://your-project-name.vercel.app';
```

## Project Structure

```
luna-backend/
├── api/
│   └── index.js             # Vercel serverless function entry point
├── src/
│   ├── routes/
│   │   └── auth.js          # Authentication routes
│   └── server.js            # Local development server
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore file
├── vercel.json             # Vercel configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Security Notes

- Never commit `.env.local` or any file containing real API keys
- Always use environment variables for sensitive data
- In production, ensure proper CORS configuration
- Use HTTPS in production

## License

ISC

