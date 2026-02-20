import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase.js';
import { UserRole } from '../types/index.js';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email: string;
                role: UserRole;
            };
        }
    }
}

/**
 * Middleware to verify Firebase ID token from Authorization header.
 * Attaches user info (uid, email, role) to req.user.
 */
export const verifyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(idToken);

        // Fetch user role from Firestore
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            role: userData?.role || UserRole.DEVELOPER, // default to developer
        };

        next();
    } catch (error) {
        console.error('Auth verification failed:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }
};

/**
 * Middleware factory to restrict access by role.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
            return;
        }

        next();
    };
};
