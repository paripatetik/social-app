import { getPostComments } from './api';
import { addPostComment, readPostComments } from './storage';
import type { Comment } from './types';

// Comments are API data plus local comments added for this post.
export async function getCommentsForPost(
  postId: number,
): Promise<Comment[]> {
  const [apiComments, localComments] = await Promise.all([
    getPostComments(postId),
    readPostComments(postId),
  ]);

  return [...apiComments, ...localComments];
}

// New comments are local-only because DummyJSON writes are not persistent.
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
