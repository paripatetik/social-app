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

export type PostsPage = PostsResponse & {
  nextSkip?: number;
};

export type EditedPost = {
  postId: number;
  title: string;
  body: string;
  tags: string[];
};

export type PostsLocalDB = {
  createdPosts: Post[];
  editedPosts: EditedPost[];
  deletedPostsIds: number[];
};
