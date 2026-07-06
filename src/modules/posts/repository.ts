import { createPost, deletePost, getPostById, getPosts, editPost } from './api';
import {
  addPostToLocalDB,
  deletePostFromLocalDB,
  editPostInLocalDB,
  readLocalDB,
} from './storage';
import type { Post, PostsResponse, EditedPost } from './types';

export async function getFeedPosts(): Promise<PostsResponse> {
  const [apiData, localDB] = await Promise.all([
    getPosts(),
    readLocalDB(),
  ]);

  const deletedIds = new Set(localDB.deletedPostsIds);

  const apiPosts = apiData.posts
    .filter(post => !deletedIds.has(post.id))
    .map(post => {
      const editedPost = localDB.editedPosts.find(
        edited => edited.postId === post.id,
      );

      if (!editedPost) {
        return post;
      }

      return {
        ...post,
        title: editedPost.title,
        body: editedPost.body,
        tags: editedPost.tags,
      };
    });

  const posts = [
    ...localDB.createdPosts,
    ...apiPosts,
  ];

  return {
    ...apiData,
    posts,
    total:
      Math.max(
        0,
        apiData.total - localDB.deletedPostsIds.length,
      ) + localDB.createdPosts.length,
  };
}

export async function getPostDetails(postId: number): Promise<Post> {
  const localDB = await readLocalDB();

  if (localDB.deletedPostsIds.includes(postId)) {
    throw new Error('Post was deleted');
  }

  const createdPost = localDB.createdPosts.find(
    post => post.id === postId,
  );

  if (createdPost) {
    return createdPost;
  }

  const apiPost = await getPostById(postId);
  const editedPost = localDB.editedPosts.find(
    post => post.postId === postId,
  );

  if (!editedPost) {
    return apiPost;
  }

  return {
  ...apiPost,
  title: editedPost.title,
  body: editedPost.body,
  tags: editedPost.tags,
};
}

export async function createFeedPost(post: Post): Promise<Post> {
  await createPost(post);
  await addPostToLocalDB(post);

  return post;
}

export async function deleteFeedPost(postId: number): Promise<number> {
  const localDB = await readLocalDB();
  const isCreatedPost = localDB.createdPosts.some(
    post => post.id === postId,
  );

  if (!isCreatedPost) {
    await deletePost(postId);
  }

  await deletePostFromLocalDB(postId);

  return postId;
}

export async function editFeedPost(editedPost: EditedPost,): Promise<EditedPost> {
  const localDB = await readLocalDB();

  const isCreatedPost = localDB.createdPosts.some(
    post => post.id === editedPost.postId,
  );

  if (!isCreatedPost) {
    const { postId, ...changes } = editedPost;

    await editPost(postId, changes);
  }

  await editPostInLocalDB(editedPost);

  return editedPost;
}