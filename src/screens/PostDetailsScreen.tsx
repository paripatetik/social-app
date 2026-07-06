import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../app/navigation/AppNavigator';
import { CommentSection } from '../modules/comments/CommentSection';
import { PostContent } from '../modules/posts/PostContent';
import { PostEditForm } from '../modules/posts/PostEditForm';
import { usePostDetails, useEditPost } from '../modules/posts/hooks';
import type { EditedPost } from '../modules/posts/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetails'>;

export function PostDetailsScreen({ route }: Props) {
  const { postId } = route.params;
  const postQuery = usePostDetails(postId);
  const [isEditing, setIsEditing] = useState(false);

  const editPostMutation = useEditPost();

  function handleSave(editedPost: EditedPost) {
    editPostMutation.mutate(editedPost, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  }

  if (postQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator accessibilityLabel="Loading post" />
      </View>
    );
  }

  if (postQuery.error || !postQuery.data) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={postQuery.error ? { color: '#dc2626' } : undefined}>
          {postQuery.error instanceof Error
            ? postQuery.error.message
            : 'Post not found'}
        </Text>
      </View>
    );
  }

  const post = postQuery.data;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: '#666', marginBottom: 12 }}>
        User #{post.userId}
      </Text>

      {isEditing ? (
        <PostEditForm
          key={post.id}
          post={post}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      ) : (
        <PostContent post={post} onEdit={() => setIsEditing(true)} />
      )}

      <CommentSection postId={postId} />
    </ScrollView>
  );
}
