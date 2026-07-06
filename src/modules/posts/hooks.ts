import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createFeedPost,
  deleteFeedPost,
  editFeedPost,
  getFeedPosts,
  getPostDetails,
} from './repository';
import type { Post, PostsResponse } from './types';

export const postKeys = {
  all: ['posts'] as const,
  detail: (postId: number) => ['post', postId] as const,
};

export function usePosts() {
  return useQuery({
    queryKey: postKeys.all,
    queryFn: getFeedPosts,
  });
}

export function usePostDetails(postId: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => getPostDetails(postId),
    initialData: () =>
      queryClient
        .getQueryData<PostsResponse>(postKeys.all)
        ?.posts.find(post => post.id === postId),
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

      const previousData = queryClient.getQueryData<PostsResponse>(
        postKeys.all,
      );

      queryClient.setQueryData<PostsResponse>(
        postKeys.all,
        currentData => {
          if (!currentData) {
            return currentData;
          }

          return {
            ...currentData,
            posts: [newPost, ...currentData.posts],
            total: currentData.total + 1,
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

      const previousData = queryClient.getQueryData<PostsResponse>(
        postKeys.all,
      );

      queryClient.setQueryData<PostsResponse>(
        postKeys.all,
        currentData => {
          if (!currentData) {
            return currentData;
          }

          return {
            ...currentData,
            posts: currentData.posts.filter(post => post.id !== postId),
            total: Math.max(0, currentData.total - 1),
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