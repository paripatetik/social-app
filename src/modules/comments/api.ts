import type { Comment } from './types';

const API_URL = 'https://dummyjson.com';

type ApiComment = {
  id: number;
  body: string;
  postId: number;
  user: {
    id: number;
    fullName: string;
  };
};

type ApiCommentsResponse = {
  comments: ApiComment[];
};

export async function getPostComments(
  postId: number,
): Promise<Comment[]> {
  const response = await fetch(`${API_URL}/comments/post/${postId}`);

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  const data = (await response.json()) as ApiCommentsResponse;

  return data.comments.map(comment => ({
    id: comment.id,
    body: comment.body,
    userId: comment.user.id,
    authorName: comment.user.fullName,
  }));
}
