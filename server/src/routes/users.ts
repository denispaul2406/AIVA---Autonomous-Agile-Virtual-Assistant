import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/users
 * List all registered users.
 * Auth: All authenticated users (so they can see who to add).
 */
router.get('/', verifyAuth, async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, // UID
                uid: doc.id,
                email: data.email,
                displayName: data.displayName || data.email?.split('@')[0] || 'Unknown',
                role: data.role || 'developer', // Default role
                photoURL: data.photoURL,
            };
        });

        res.json({ users });
    } catch (error: any) {
        console.error('List users error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
