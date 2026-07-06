import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PostTags } from '../modules/posts/PostTags';
import type { RootStackParamList } from '../app/navigation/AppNavigator';
import { useDeletePost, usePosts } from '../modules/posts/hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

export function FeedScreen({ navigation }: Props) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = usePosts();

  const deletePostMutation = useDeletePost();

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  function confirmDelete(postId: number, postTitle: string) {
    Alert.alert(
      'Delete post?',
      `This will delete "${postTitle}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePostMutation.mutate(postId),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator accessibilityLabel="Loading posts" />
        <Text style={{ marginTop: 12 }}>Loading posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#dc2626', textAlign: 'center' }}>
          {error instanceof Error ? error.message : String(error)}
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={isFetching}
          onPress={() => {
            void refetch();
          }}
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: isFetching ? '#9ca3af' : '#2563eb',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {isFetching ? 'Retrying...' : 'Retry'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {deletePostMutation.error ? (
        <Text style={{ color: '#dc2626', marginBottom: 12 }}>
          {deletePostMutation.error instanceof Error
            ? deletePostMutation.error.message
            : 'Failed to delete post'}
        </Text>
      ) : null}

      <FlatList
        data={posts}
        refreshing={isRefetching && !isFetchingNextPage}
        onRefresh={() => {
          void refetch();
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetching) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              accessibilityLabel="Loading more posts"
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={{
              position: 'relative',
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('PostDetails', { postId: item.id })
              }
              style={{ padding: 16 }}
            >
              <Text>User#{item.userId}</Text>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {item.title}
              </Text>
              <Text style={{ marginTop: 8 }}>{item.body}</Text>

              <PostTags tags={item.tags} />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <Text>👁 {item.views}</Text>
                <Text>👍 {item.reactions.likes}</Text>
                <Text>👎 {item.reactions.dislikes}</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityLabel={`Delete ${item.title}`}
              accessibilityRole="button"
              disabled={deletePostMutation.isPending}
              hitSlop={10}
              onPress={() => confirmDelete(item.id, item.title)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: deletePostMutation.isPending
                  ? '#9ca3af'
                  : '#ef4444',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: '700',
                }}
              >
                ×
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
