import express from 'express';
import { requireAuth, getAuth } from '@clerk/express';

const router = express.Router();

function calculateUserSimilarity(userLikes, otherUserLikes) {
  const allPosts = new Set([...userLikes, ...otherUserLikes]);
  
  if (allPosts.size === 0) return 0;
  
  const userVector = Array.from(allPosts).map(postId => 
    userLikes.includes(postId) ? 1 : 0
  );
  const otherUserVector = Array.from(allPosts).map(postId => 
    otherUserLikes.includes(postId) ? 1 : 0
  );
  
  // Cosine similarity calculation
  let dotProduct = 0;
  let userMagnitude = 0;
  let otherUserMagnitude = 0;
  
  for (let i = 0; i < userVector.length; i++) {
    dotProduct += userVector[i] * otherUserVector[i];
    userMagnitude += userVector[i] * userVector[i];
    otherUserMagnitude += otherUserVector[i] * otherUserVector[i];
  }
  
  const magnitude = Math.sqrt(userMagnitude) * Math.sqrt(otherUserMagnitude);
  if (magnitude === 0) return 0;
  
  return dotProduct / magnitude;
}

async function getRecommendations(userId) {
  const mockData = {
    userLikes: {
      'user_1': ['post_1', 'post_2', 'post_3', 'post_5'],
      'user_2': ['post_2', 'post_3', 'post_4', 'post_6'],
      'user_3': ['post_1', 'post_4', 'post_7', 'post_8'],
      'user_4': ['post_2', 'post_5', 'post_6', 'post_9'],
    },
    postBusinessMap: {
      'post_1': 'business_1',
      'post_2': 'business_2',
      'post_3': 'business_1',
      'post_4': 'business_3',
      'post_5': 'business_2',
      'post_6': 'business_3',
      'post_7': 'business_4',
      'post_8': 'business_4',
      'post_9': 'business_5',
    },
    businesses: {
      'business_1': { id: 'business_1', name: 'Coffee Shop A', category: 'Food & Drink' },
      'business_2': { id: 'business_2', name: 'Restaurant B', category: 'Food & Drink' },
      'business_3': { id: 'business_3', name: 'Gym C', category: 'Fitness' },
      'business_4': { id: 'business_4', name: 'Salon D', category: 'Beauty' },
      'business_5': { id: 'business_5', name: 'Bookstore E', category: 'Retail' },
    }
  };
  
  const currentUserLikes = mockData.userLikes[userId] || [];
  
  if (currentUserLikes.length === 0) {
    return {
      potentialFriends: [],
      recommendedBusinesses: [],
      message: 'No likes found for user. Start liking posts to get recommendations!'
    };
  }
  
  // Find users with similar preferences
  const userSimilarities = [];
  for (const [otherUserId, otherUserLikes] of Object.entries(mockData.userLikes)) {
    if (otherUserId === userId) continue;
    
    const similarity = calculateUserSimilarity(currentUserLikes, otherUserLikes);
    if (similarity > 0) {
      userSimilarities.push({
        userId: otherUserId,
        similarity: similarity,
        sharedLikes: currentUserLikes.filter(like => otherUserLikes.includes(like)).length
      });
    }
  }
  
  userSimilarities.sort((a, b) => b.similarity - a.similarity);
  const topSimilarUsers = userSimilarities.slice(0, 10);
  
  // Recommend businesses based on similar users' likes
  const recommendedPostIds = new Set();
  const postScores = {};
  
  for (const similarUser of topSimilarUsers) {
    const similarUserLikes = mockData.userLikes[similarUser.userId];
    for (const postId of similarUserLikes) {
      if (!currentUserLikes.includes(postId)) {
        recommendedPostIds.add(postId);
        if (!postScores[postId]) {
          postScores[postId] = 0;
        }
        postScores[postId] += similarUser.similarity;
      }
    }
  }
  
  const businessScores = {};
  for (const postId of recommendedPostIds) {
    const businessId = mockData.postBusinessMap[postId];
    if (businessId) {
      if (!businessScores[businessId]) {
        businessScores[businessId] = {
          business: mockData.businesses[businessId],
          score: 0,
          recommendedPosts: []
        };
      }
      businessScores[businessId].score += postScores[postId];
      businessScores[businessId].recommendedPosts.push(postId);
    }
  }
  
  const recommendedBusinesses = Object.values(businessScores)
    .sort((a, b) => b.score - a.score)
    .map(item => ({
      business: item.business,
      recommendationScore: item.score,
      reason: `Liked by ${item.recommendedPosts.length} similar user(s)`
    }));
  
  return {
    potentialFriends: topSimilarUsers.map(user => ({
      userId: user.userId,
      similarityScore: user.similarity,
      sharedInterests: user.sharedLikes
    })),
    recommendedBusinesses: recommendedBusinesses.slice(0, 20),
    algorithm: 'collaborative_filtering',
    totalSimilarUsers: userSimilarities.length
  };
}

/**
 * @swagger
 * /api/recommendation:
 *   get:
 *     summary: Get personalized recommendations using collaborative filtering
 *     tags: [Recommendations]
 *     description: |
 *       Returns potential friends (users with similar post likes) and recommended businesses
 *       based on collaborative filtering algorithm. The algorithm finds users with similar
 *       preferences and recommends businesses that those similar users have liked.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 potentialFriends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       similarityScore:
 *                         type: number
 *                         description: Similarity score between 0 and 1
 *                       sharedInterests:
 *                         type: number
 *                         description: Number of posts both users liked
 *                 recommendedBusinesses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       business:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           category:
 *                             type: string
 *                       recommendationScore:
 *                         type: number
 *                       reason:
 *                         type: string
 *                 algorithm:
 *                   type: string
 *                 totalSimilarUsers:
 *                   type: number
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - user not authenticated',
      });
    }
    
    const recommendations = await getRecommendations(userId);
    
    res.json({
      success: true,
      ...recommendations
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations',
    });
  }
});

export default router;

