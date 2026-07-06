import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

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
  const scrollViewRef = useRef<ScrollView>(null);
  const isCommentInputFocused = useRef(false);

  const editPostMutation = useEditPost();

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (isCommentInputFocused.current) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    });

    return () => subscription.remove();
  }, []);

  function handleSave(editedPost: EditedPost) {
    editPostMutation.mutate(editedPost, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  }

  function handleCancelEdit() {
    editPostMutation.reset();
    setIsEditing(false);
  }

  function handleStartEdit() {
    editPostMutation.reset();
    setIsEditing(true);
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
      <View
        style={{
          flex: 1,
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={postQuery.error ? { color: '#dc2626' } : undefined}>
          {postQuery.error instanceof Error
            ? postQuery.error.message
            : 'Post not found'}
        </Text>

        {postQuery.error ? (
          <Pressable
            accessibilityRole="button"
            disabled={postQuery.isFetching}
            onPress={() => {
              void postQuery.refetch();
            }}
            style={{
              marginTop: 16,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: postQuery.isFetching
                ? '#9ca3af'
                : '#2563eb',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {postQuery.isFetching ? 'Retrying...' : 'Retry'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const post = postQuery.data;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
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
            isSaving={editPostMutation.isPending}
            onCancel={handleCancelEdit}
            onSave={handleSave}
          />
        ) : (
          <PostContent post={post} onEdit={handleStartEdit} />
        )}

        {editPostMutation.error ? (
          <Text style={{ color: '#dc2626', marginTop: 12 }}>
            {editPostMutation.error instanceof Error
              ? editPostMutation.error.message
              : 'Failed to save post'}
          </Text>
        ) : null}

        <CommentSection
          postId={postId}
          onInputBlur={() => {
            isCommentInputFocused.current = false;
          }}
          onInputFocus={() => {
            isCommentInputFocused.current = true;
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
