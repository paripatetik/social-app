import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addPostComment, readPostComments } from './storage';
import type { Comment } from './types';

const commentKeys = {
  byPost: (postId: number) => ['comments', postId] as const,
};

export function usePostComments(postId: number) {
  return useQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: () => readPostComments(postId),
  });
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => {
      const comment: Comment = {
        id: Date.now(),
        body: body.trim(),
        userId: 1,
        createdAt: new Date().toISOString(),
      };

      return addPostComment(postId, comment);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commentKeys.byPost(postId),
      });
    },
  });
}
