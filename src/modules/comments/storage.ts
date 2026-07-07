import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Comment } from './types';

// Keep comments per post so adding one comment does not rewrite the posts DB.
function commentsKey(postId: number) {
  return `comments:${postId}`;
}

export async function readPostComments(
  postId: number,
): Promise<Comment[]> {
  const storedValue = await AsyncStorage.getItem(commentsKey(postId));

  if (!storedValue) {
    return [];
  }

  return JSON.parse(storedValue) as Comment[];
}

export async function addPostComment(
  postId: number,
  comment: Comment,
): Promise<Comment> {
  const comments = await readPostComments(postId);

  await AsyncStorage.setItem(
    commentsKey(postId),
    JSON.stringify([...comments, comment]),
  );

  return comment;
}
