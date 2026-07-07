import { createPost, deletePost, getPostById, getPosts, editPost } from './api';
import {
  addPostToLocalDB,
  deletePostFromLocalDB,
  editPostInLocalDB,
  readLocalDB,
} from './storage';
import type { EditedPost, Post, PostsPage } from './types';

// The feed is API data with local AsyncStorage changes layered on top.
export async function getFeedPosts(
  skip = 0,
  limit = 10,
): Promise<PostsPage> {
  const [apiData, localDB] = await Promise.all([
    getPosts(skip, limit),
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

  const nextSkip =
    apiData.skip + apiData.limit < apiData.total
      ? apiData.skip + apiData.limit
      : undefined;

  // Local-only posts do not affect DummyJSON pagination, so they are only
  // prepended to the first page.
  return {
    ...apiData,
    posts: [
      ...(skip === 0 ? localDB.createdPosts : []),
      ...apiPosts,
    ],
    total:
      Math.max(
        0,
        apiData.total - localDB.deletedPostsIds.length,
      ) + localDB.createdPosts.length,
    nextSkip,
  };
}

// Details resolve local state first: deleted, created, then edited API posts.
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

// DummyJSON accepts the request but does not persist it, so we persist locally.
export async function createFeedPost(post: Post): Promise<Post> {
  await createPost(post);
  await addPostToLocalDB(post);

  return post;
}

// Local-only posts do not exist on the API; API posts need a local tombstone.
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

// Edits are stored locally as an overlay because DummyJSON does not persist them.
export async function editFeedPost(
  editedPost: EditedPost,
): Promise<EditedPost> {
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
