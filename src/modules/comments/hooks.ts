import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createLocalComment, getCommentsForPost } from './repository';

const commentKeys = {
  byPost: (postId: number) => ['comments', postId] as const,
};

export function usePostComments(postId: number) {
  return useQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: () => getCommentsForPost(postId),
  });
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => createLocalComment(postId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commentKeys.byPost(postId),
      });
    },
  });
}
