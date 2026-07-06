
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../app/navigation/AppNavigator';

import { getFeedPosts, deletePost, PostsResponse } from '../shared/api/posts';


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {deletePostFromLocalDB,readLocalDB,} from '../shared/api/localDB';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;


export function FeedScreen({ navigation }: Props) {


  const { data, isLoading, error, isRefetching, refetch} = useQuery({
    queryKey: ['posts'],
    queryFn: getFeedPosts,
  });

  const posts = data?.posts ?? [];

  const queryClient = useQueryClient();


 const deletePostMutation = useMutation({

 mutationFn: async (postID: number) => {
  const localDB = await readLocalDB();

  const isCreatedPost = localDB.createdPosts.some(
    post => post.id === postID,
  );

  if (!isCreatedPost) {
    await deletePost(postID);
  }

  await deletePostFromLocalDB(postID);

  return postID;
},

  onMutate: async (postID: number) => {
    
    await queryClient.cancelQueries({
      queryKey: ['posts'],
    });

    const previousData = queryClient.getQueryData<PostsResponse>(['posts']);

    queryClient.setQueryData<PostsResponse>(
      ['posts'],
      currentData => {
        if (!currentData) {
          return currentData;
        }

        return {
          ...currentData,
          posts: currentData.posts.filter(
            post => post.id !== postID,
          ),
          total: Math.max(0, currentData.total - 1),
        };
      },
  );

  return { previousData };
  },

  onError: (_error, _newPost, context) => {
    if (context?.previousData) {
      queryClient.setQueryData(
        ['posts'],
        context.previousData,
      );
    }
  },

  
  onSettled: async () => {
    await queryClient.invalidateQueries({
      queryKey: ['posts'],
    });
  },
});



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
      <ActivityIndicator />
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
      <Text>
        {error instanceof Error ? error.message : String(error)}
      </Text>
    </View>
  );
}

return (
  <>
  <View style={{ flex: 1, padding: 16 }}>
    
    <FlatList
     
      data={posts}
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
        }}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            navigation.navigate('PostDetails', { postId: item.id })
          }
          style={{
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
          }}
        >
       <Pressable
          onPress={event => {
            event.stopPropagation();
            deletePostMutation.mutate(item.id);
          }}
          hitSlop={10}
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
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
            ×
          </Text>
        </Pressable>

           <Text>
          User#{item.userId}
        </Text>

          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            {item.title}
          </Text>

          <Text style={{ marginTop: 8 }}>
            {item.body}
          </Text>

                 <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
          {item.tags.map((tag) => (
            <Text
              key={tag}
              style={{
                marginRight: 8,
                marginBottom: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 12,
              }}
            >
              #{tag}
            </Text>
          ))}
        </View>

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
      )}
    />

  </View>

  </>
 
);
}