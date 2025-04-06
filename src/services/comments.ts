const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Define more specific types
interface CommentInput {
  content: string;
  user: string;
}

interface CommentResponse {
  id: number;
  content: string;
  user?: string;
  name?: string;
  designation?: string;
  rating?: number;
}

/**
 * Saves a new comment to the backend and updates the in-memory comments state.
 * @param comment - The comment object to save.
 */
export async function saveComment(comment: CommentInput) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error:', errorData);
      throw new Error(`Failed to save comment: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving comment:', error);
    // We're rethrowing the error to handle it in the component
    throw error;
  }
}

/**
 * Gets all comments from the backend API.
 * @returns Array of comment objects
 */
export async function getComments(): Promise<CommentResponse[]> {
  try {
    console.log(`Fetching comments from: ${API_BASE_URL}/api/comments`);
    
    const response = await fetch(`${API_BASE_URL}/api/comments`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Comments API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error retrieving comments:', error);
    // Return empty array to prevent crashes, but log the error for debugging
    console.warn('Returning fallback data from local source');
    return []; // Return an empty array to prevent crashes
  }
}
