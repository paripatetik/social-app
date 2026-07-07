import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import {
  createFeedPost,
  deleteFeedPost,
  editFeedPost,
  getFeedPosts,
  getPostDetails,
} from './repository';

import type { EditedPost, Post, PostsPage } from './types';

// Infinite query cache shape used by the optimistic updates below.
type PostsCache = InfiniteData<PostsPage, number>;

export const postKeys = {
  all: ['posts'] as const,
  detail: (postId: number) => ['post', postId] as const,
};

export function usePosts() {
  
  return useInfiniteQuery({
    queryKey: postKeys.all,
    queryFn: ({ pageParam }) => getFeedPosts(pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.nextSkip,
  });
}

export function usePostDetails(postId: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => getPostDetails(postId),
    // Show cached feed data immediately, then let the detail query verify it.
    initialData: () =>
      queryClient
        .getQueryData<PostsCache>(postKeys.all)
        ?.pages.flatMap(page => page.posts)
        .find(post => post.id === postId),
  });
}

type UseCreatePostOptions = {
  onSuccess?: () => void;
};

export function useCreatePost(options: UseCreatePostOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeedPost,
    onMutate: async (newPost: Post) => {
      await queryClient.cancelQueries({ queryKey: postKeys.all });

      // Save a snapshot so the optimistic insert can be rolled back on failure.
      const previousData = queryClient.getQueryData<PostsCache>(
        postKeys.all,
      );

      queryClient.setQueryData<PostsCache>(
        postKeys.all,
        currentData => {
          if (!currentData) {
            return currentData;
          }

          const [firstPage, ...remainingPages] = currentData.pages;

          if (!firstPage) {
            return currentData;
          }

          return {
            ...currentData,
            pages: [
              {
                ...firstPage,
                // New local posts are visible at the top before the request ends.
                posts: [newPost, ...firstPage.posts],
                total: firstPage.total + 1,
              },
              ...remainingPages,
            ],
          };
        },
      );

      return { previousData };
    },
    onError: (_error, _newPost, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(postKeys.all, context.previousData);
      }
    },
    onSuccess: options.onSuccess,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFeedPost,
    onMutate: async (postId: number) => {
      await queryClient.cancelQueries({ queryKey: postKeys.all });

      // Remove the card immediately, but keep the previous cache for rollback.
      const previousData = queryClient.getQueryData<PostsCache>(
        postKeys.all,
      );

      queryClient.setQueryData<PostsCache>(
        postKeys.all,
        currentData => {
          if (!currentData) {
            return currentData;
          }

          return {
            ...currentData,
            pages: currentData.pages.map(page => ({
              ...page,
              posts: page.posts.filter(post => post.id !== postId),
              total: Math.max(0, page.total - 1),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (_error, _postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(postKeys.all, context.previousData);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useEditPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editFeedPost,
    onMutate: async (editedPost: EditedPost) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: postKeys.all }),
        queryClient.cancelQueries({
          queryKey: postKeys.detail(editedPost.postId),
        }),
      ]);

      const previousPosts = queryClient.getQueryData<PostsCache>(
        postKeys.all,
      );
      const previousPost = queryClient.getQueryData<Post>(
        postKeys.detail(editedPost.postId),
      );

      // Apply the same optimistic edit to both feed pages and the detail cache.
      const applyEdit = (post: Post): Post =>
        post.id === editedPost.postId
          ? {
              ...post,
              title: editedPost.title,
              body: editedPost.body,
              tags: editedPost.tags,
            }
          : post;

      queryClient.setQueryData<PostsCache>(
        postKeys.all,
        currentData =>
          currentData
            ? {
                ...currentData,
                pages: currentData.pages.map(page => ({
                  ...page,
                  posts: page.posts.map(applyEdit),
                })),
              }
            : currentData,
      );

      queryClient.setQueryData<Post>(
        postKeys.detail(editedPost.postId),
        currentPost => currentPost ? applyEdit(currentPost) : currentPost,
      );

      return { previousPost, previousPosts };
    },
    onError: (_error, editedPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.all, context.previousPosts);
      }

      if (context?.previousPost) {
        queryClient.setQueryData(
          postKeys.detail(editedPost.postId),
          context.previousPost,
        );
      }
    },

    onSettled: async (_data, _error, editedPost) => {
      await queryClient.invalidateQueries({
        queryKey: postKeys.all,
      });

      await queryClient.invalidateQueries({
        queryKey: postKeys.detail(editedPost.postId),
      });
    },
  });
}
