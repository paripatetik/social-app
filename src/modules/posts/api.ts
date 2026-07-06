
import type { EditedPost, Post, PostsResponse } from './types';

const API_URL = 'https://dummyjson.com';

export async function getPosts(
  skip = 0,
  limit = 10,
): Promise<PostsResponse> {
  const response = await fetch(
    `${API_URL}/posts?limit=${limit}&skip=${skip}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
}

export async function getPostById(postId: number): Promise<Post> {
  const response = await fetch(`${API_URL}/posts/${postId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch post');
  }

  return response.json();
}

export async function createPost(post: Post): Promise<Post> {
  const response = await fetch(`${API_URL}/posts/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    throw new Error('Failed to create post');
  }

  return response.json();
}

export async function deletePost(postId: number): Promise<void> {
  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
}

export async function editPost(
  postId: number,
  updatedPost: Omit<EditedPost, 'postId'>,
): Promise<Post> {
  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedPost),
  });

  if (!response.ok) {
    throw new Error('Failed to edit post');
  }

  return response.json();
}
