import fs from 'fs';
import path from 'path';
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const COMMENTS_FILE_PATH = path.resolve(process.cwd(), 'src/data/comments.json');

// Ensure the comments file exists
const initializeCommentsFile = () => {
  if (!fs.existsSync(COMMENTS_FILE_PATH)) {
    fs.writeFileSync(COMMENTS_FILE_PATH, JSON.stringify([]), 'utf8');
    console.log('Created empty comments file');
  }
};

// Initialize the file when the server starts
initializeCommentsFile();

// GET /api/comments - Get all comments
router.get('/', (_req: Request, res: Response) => {
  try {
    // Read comments from file
    const commentsData = fs.existsSync(COMMENTS_FILE_PATH)
      ? JSON.parse(fs.readFileSync(COMMENTS_FILE_PATH, 'utf-8'))
      : [];

    return res.status(200).json(commentsData);
  } catch (error) {
    console.error('Error reading comments:', error);
    return res.status(500).json({ error: 'Failed to read comments' });
  }
});

// POST /api/comments - Add a new comment
router.post(
  '/',
  [
    body('content').notEmpty().withMessage('Comment content is required'),
    body('user').notEmpty().withMessage('User name is required')
  ],
  (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, user } = req.body;
      const newComment = { 
        id: Date.now(), // Use timestamp as ID
        content, 
        user 
      };

      // Read existing comments
      const commentsData = fs.existsSync(COMMENTS_FILE_PATH)
        ? JSON.parse(fs.readFileSync(COMMENTS_FILE_PATH, 'utf-8'))
        : [];

      // Add the new comment
      commentsData.push(newComment);

      // Write back to file
      fs.writeFileSync(COMMENTS_FILE_PATH, JSON.stringify(commentsData, null, 2));

      return res.status(201).json({ 
        success: true, 
        comment: newComment,
        message: 'Comment added successfully'
      });
    } catch (error) {
      console.error('Error saving comment:', error);
      return res.status(500).json({ error: 'Failed to save comment' });
    }
  }
);

export default router;
