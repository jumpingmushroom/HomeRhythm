import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database';
import { config } from '../config';
import { validateRequest, registerSchema, loginSchema } from '../utils/validation';
import { User } from '../types';

const router = Router();

// Register a new user
router.post('/register', async (req, res) => {
  const validation = validateRequest(registerSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password } = validation.data;
  const db = getDatabase();

  try {
    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, password_hash);

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.lastInsertRowid },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.lastInsertRowid, email },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const validation = validateRequest(loginSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password } = validation.data;
  const db = getDatabase();

  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(decoded.userId) as Omit<User, 'password_hash'> | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

export default router;
