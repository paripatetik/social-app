import { useState } from 'react';
import { View, TextInput, Button, Text, Pressable } from 'react-native';
import { RootStackParamList } from '../app/navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, Post, PostsResponse } from '../shared/api/posts';

import { addPostToLocalDB } from '../shared/api/localDB';



type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

export function CreatePostScreen({ navigation }: Props) {

  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const createPostMutation = useMutation({

  mutationFn: async (newPost: Post) => {
    
    await createPost(newPost);
    await addPostToLocalDB(newPost);

    return newPost;
  },

  onMutate: async (newPost) => {
    
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
          posts: [newPost, ...currentData.posts],
          total: currentData.total + 1,
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

  onSuccess: () => {
    navigation.goBack();
  },

  onSettled: async () => {
    await queryClient.invalidateQueries({
      queryKey: ['posts'],
    });
  },
});

  async function handleCreate() {
    const newPost: Post = {
      id: Date.now(),
      title: title.trim(),
      body: body.trim(),
      tags,
      userId: 1,
      reactions: {
        likes: 0,
        dislikes: 0,
      },
      views: 0,
    };

  createPostMutation.mutate(newPost);
  }

  function addTag() {
  const normalizedTag = tagInput
    .trim()
    .replace(/^#/, '')
    .toLowerCase();

  if (!normalizedTag || tags.includes(normalizedTag)) {
    return;
  }

  setTags(currentTags => [...currentTags, normalizedTag]);
  setTagInput('');
}

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ marginBottom: 8 }}>Title</Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Post title"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />

      <Text style={{ marginBottom: 8 }}>Body</Text>

      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Post body"
        multiline
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          minHeight: 140,
          textAlignVertical: 'top',
          marginBottom: 16,
        }}
      />

      <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
          placeholder="Enter tag"
          returnKeyType="done"
        />
      <Button title="Add tag" onPress={addTag} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <Pressable
              key={tag}
              onPress={() =>
                setTags(currentTags =>
                  currentTags.filter(item => item !== tag),
                )
              }
            >
              <Text>#{tag} ×</Text>
            </Pressable>
          ))}
        </View>


<Pressable 
    onPress={handleCreate}  
    style={{
      marginTop: 16,
      backgroundColor: '#7facddff',
      borderRadius: 8,
      alignItems: 'center',
      padding: 14,
    }}>
    <Text>Create post</Text>
</Pressable>
</View>
  );
}