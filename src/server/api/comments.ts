import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const COMMENTS_FILE_PATH = path.resolve(process.cwd(), 'src/data/comments.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const newComment = req.body;

      // Read existing comments
      const commentsData = fs.existsSync(COMMENTS_FILE_PATH)
        ? JSON.parse(fs.readFileSync(COMMENTS_FILE_PATH, 'utf-8'))
        : [];

      // Add the new comment
      commentsData.push(newComment);

      // Write back to the file
      fs.writeFileSync(COMMENTS_FILE_PATH, JSON.stringify(commentsData, null, 2));

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving comment:', error);
      res.status(500).json({ error: 'Failed to save comment' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
