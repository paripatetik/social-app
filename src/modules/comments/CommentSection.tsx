import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { useCreateComment, usePostComments } from './hooks';

type CommentSectionProps = {
  postId: number;
};

export function CommentSection({ postId }: CommentSectionProps) {
  const commentsQuery = usePostComments(postId);
  const createCommentMutation = useCreateComment(postId);
  const [body, setBody] = useState('');
  const canSubmit = body.trim().length > 0 && !createCommentMutation.isPending;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    try {
      await createCommentMutation.mutateAsync(body.trim());
      setBody('');
    } catch {
      // The mutation error is rendered below the input.
    }
  }

  return (
    <View
      style={{
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16 }}>
        Comments
      </Text>

      {commentsQuery.isLoading ? (
        <ActivityIndicator accessibilityLabel="Loading comments" />
      ) : commentsQuery.error ? (
        <Text style={{ color: '#dc2626' }}>
          {commentsQuery.error instanceof Error
            ? commentsQuery.error.message
            : 'Failed to load comments'}
        </Text>
      ) : commentsQuery.data?.length ? (
        <View style={{ gap: 10 }}>
          {commentsQuery.data.map(comment => (
            <View
              key={comment.id}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>
                User #{comment.userId}
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 21 }}>
                {comment.body}
              </Text>
              <Text
                style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}
              >
                {new Date(comment.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: '#6b7280' }}>No comments yet.</Text>
      )}

      <View style={{ marginTop: 16 }}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write a comment"
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 80,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
          }}
        />

        {createCommentMutation.error ? (
          <Text style={{ color: '#dc2626', marginTop: 8 }}>
            {createCommentMutation.error instanceof Error
              ? createCommentMutation.error.message
              : 'Failed to add comment'}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={() => {
            void handleSubmit();
          }}
          style={{
            alignSelf: 'flex-end',
            marginTop: 10,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: canSubmit ? '#2563eb' : '#9ca3af',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {createCommentMutation.isPending ? 'Adding...' : 'Add comment'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
