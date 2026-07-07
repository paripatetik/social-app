import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Post, PostsLocalDB, EditedPost } from './types';

const LOCAL_DB_KEY = 'localDB';

// Store only local deltas.
function createEmptyDB(): PostsLocalDB {
  return {
    createdPosts: [],
    editedPosts: [],
    deletedPostsIds: [],
  };
}

// First read also creates the key, so the rest of the app can rely on shape.
export async function readLocalDB(): Promise<PostsLocalDB> {
  const storedValue = await AsyncStorage.getItem(LOCAL_DB_KEY);

  if (!storedValue) {
    const emptyDB = createEmptyDB();

    await AsyncStorage.setItem(LOCAL_DB_KEY, JSON.stringify(emptyDB));

    return emptyDB;
  }

  const storedDB = JSON.parse(storedValue) as Partial<PostsLocalDB>;

  return {
    createdPosts: storedDB.createdPosts ?? [],
    editedPosts: storedDB.editedPosts ?? [],
    deletedPostsIds: storedDB.deletedPostsIds ?? [],
  };
}

export async function writeLocalDB(db: PostsLocalDB): Promise<void> {
  await AsyncStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

export async function addPostToLocalDB(post: Post): Promise<void> {
  const localDB = await readLocalDB();

  await writeLocalDB({
    ...localDB,
    createdPosts: [post, ...localDB.createdPosts],
  });
}

export async function deletePostFromLocalDB(
  postId: number,
): Promise<void> {
  const localDB = await readLocalDB();
  const isCreatedPost = localDB.createdPosts.some(
    post => post.id === postId,
  );

  // Local-only posts can be removed completely.
  if (isCreatedPost) {
    await writeLocalDB({
      ...localDB,
      createdPosts: localDB.createdPosts.filter(
        post => post.id !== postId,
      ),
    });

    return;
  }

  // API posts are hidden with a tombstone because the dummy API will re-send them.
  if (localDB.deletedPostsIds.includes(postId)) {
    return;
  }

  await writeLocalDB({
    ...localDB,
    deletedPostsIds: [...localDB.deletedPostsIds, postId],
  });
}

export async function editPostInLocalDB(
  editedPost: EditedPost,
): Promise<void> {
  const localDB = await readLocalDB();
  const { postId, title, body, tags } = editedPost;

  const isCreatedPost = localDB.createdPosts.some(
    post => post.id === postId,
  );

  // Created posts live only locally, so edit the actual local object.
  if (isCreatedPost) {
    await writeLocalDB({
      ...localDB,
      createdPosts: localDB.createdPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              title,
              body,
              tags,
            }
          : post,
      ),
    });

    return;
  }

  // API posts keep one latest local overlay by post id.
  await writeLocalDB({
    ...localDB,
    editedPosts: [
      ...localDB.editedPosts.filter(
        post => post.postId !== postId,
      ),
      editedPost,
    ],
  });
}
