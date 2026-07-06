import { readLocalDB } from "./localDB";

const API_URL = 'https://dummyjson.com';

export type Post = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: {
    likes: number;
    dislikes: number;
  };
  views: number;
  userId: number;
};

export type PostsResponse = {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
};

export async function getPosts(): Promise<PostsResponse> {
  const response = await fetch(`${API_URL}/posts?limit=10`);

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
}

export async function getFeedPosts(): Promise<PostsResponse> {
  const [apiData, localDB] = await Promise.all([
    getPosts(),
    readLocalDB(),
  ]);

  const deletedIds = new Set(localDB.deletedPostsIds);

  const posts = [
    ...localDB.createdPosts,
    ...apiData.posts.filter(post => !deletedIds.has(post.id)),
  ];

  return {
    ...apiData,
    posts,
    total: Math.max(
      0,
      apiData.total - localDB.deletedPostsIds.length,
    ) + localDB.createdPosts.length,
  };
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