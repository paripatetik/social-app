import { getPostComments } from './api';
import { addPostComment, readPostComments } from './storage';
import type { Comment } from './types';

export async function getCommentsForPost(
  postId: number,
): Promise<Comment[]> {
  const [apiComments, localComments] = await Promise.all([
    getPostComments(postId),
    readPostComments(postId),
  ]);

  return [...apiComments, ...localComments];
}

export async function createLocalComment(
  postId: number,
  body: string,
): Promise<Comment> {
  const comment: Comment = {
    id: Date.now(),
    body: body.trim(),
    userId: 1,
    authorName: 'You',
    createdAt: new Date().toISOString(),
  };

  return addPostComment(postId, comment);
}
