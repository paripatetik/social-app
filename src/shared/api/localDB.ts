import AsyncStorage from "@react-native-async-storage/async-storage";

import { Post } from "./posts";

const LOCAL_DB_KEY = "localDB";

type editedPosts = {
    postId: number;
    title?: string;
    body?: string;
    tags?: string[];
}

type comments = {
    postId: number;
    commentId: number;
    body: string;
}

export type LocalDB = {
  createdPosts: Post[];
  editedPosts: editedPosts[];
  deletedPostsIds: number[];
  comments: comments[];
};

function createEmptyDB(): LocalDB {
  return {
    createdPosts: [],
    editedPosts: [],
    deletedPostsIds: [],
    comments: [],
  };
}

export async function readLocalDB(): Promise<LocalDB> {

  const storedValue = await AsyncStorage.getItem(LOCAL_DB_KEY);

  if (!storedValue) {
    const emptyDB = createEmptyDB();

    await AsyncStorage.setItem(
      LOCAL_DB_KEY,
      JSON.stringify(emptyDB),
    );

    return emptyDB;
  }

  return JSON.parse(storedValue) as LocalDB;
}

export async function writeLocalDB(db: LocalDB): Promise<void> {
  await AsyncStorage.setItem(
    LOCAL_DB_KEY,
    JSON.stringify(db),
  );
}

 export async function addPostToLocalDB(post: Post): Promise<void> {
  const localDB = await readLocalDB();

  const updatedLocalDB = {
    ...localDB,
    createdPosts: [post, ...localDB.createdPosts],
  };

  await writeLocalDB(updatedLocalDB);
}

export async function deletePostFromLocalDB(
  postId: number,
): Promise<void> {
  const localDB = await readLocalDB();

  const isCreatedPost = localDB.createdPosts.some(
    post => post.id === postId,
  );

  if (isCreatedPost) {
    await writeLocalDB({
      ...localDB,
      createdPosts: localDB.createdPosts.filter(
        post => post.id !== postId,
      ),
    });

    return;
  }

  if (localDB.deletedPostsIds.includes(postId)) {
    return;
  }

  await writeLocalDB({
    ...localDB,
    deletedPostsIds: [
      ...localDB.deletedPostsIds,
      postId,
    ],
  });
}
