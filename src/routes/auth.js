import express from 'express';
import { requireAuth, getAuth, clerkClient } from '@clerk/express';

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePassword123!
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phoneNumber:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Create user in Clerk
    const userData = {
      emailAddress: [email],
      password,
      firstName,
      lastName,
    };

    if (phoneNumber) {
      userData.phoneNumbers = [phoneNumber];
    }

    const user = await clerkClient.users.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        emailAddress: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumbers[0]?.phoneNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get session token
 *     tags: [Authentication]
 *     description: |
 *       Note: This endpoint is for demonstration. In production, Clerk handles authentication
 *       on the frontend. The user should authenticate using Clerk's frontend SDK, which will
 *       provide a session token that can be used to authenticate API requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Authentication successful (in production, use Clerk frontend SDK)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Note: In production, authentication should be handled by Clerk's frontend SDK
    // This endpoint is for demonstration purposes only
    // The actual authentication flow should use Clerk's SignIn component on the frontend
    // which will provide a session token that can be used for API authentication

    res.status(200).json({
      success: true,
      message:
        'For authentication, please use Clerk\'s frontend SDK. After authentication, use the session token in the Authorization header for protected endpoints.',
      note: 'Use Clerk SignIn component on frontend to get session token',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Authentication failed',
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     emailAddress:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                     createdAt:
 *                       type: number
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/profile', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - user not authenticated',
      });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        emailAddress: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumbers[0]?.phoneNumber,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user profile',
    });
  }
});

export default router;

