import {
  ActivityIndicator,
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
        <Text>{error instanceof Error ? error.message : String(error)}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
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
              hitSlop={10}
              onPress={() => deletePostMutation.mutate(item.id)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#ef4444',
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
