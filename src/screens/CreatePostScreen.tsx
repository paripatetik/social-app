import { useState } from 'react';
import {
  Button,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../app/navigation/AppNavigator';
import { useCreatePost } from '../modules/posts/hooks';
import type { Post } from '../modules/posts/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

export function CreatePostScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const createPostMutation = useCreatePost({
    onSuccess: () => navigation.goBack(),
  });

  function handleCreate() {
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

  function removeTag(tagToRemove: string) {
    setTags(currentTags =>
      currentTags.filter(tag => tag !== tagToRemove),
    );
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
        textAlignVertical="top"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          minHeight: 140,
          marginBottom: 16,
        }}
      />

      <TextInput
        value={tagInput}
        onChangeText={setTagInput}
        onSubmitEditing={addTag}
        placeholder="Enter tag"
        returnKeyType="done"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
        }}
      />
      <Button title="Add tag" onPress={addTag} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {tags.map(tag => (
          <Pressable
            accessibilityLabel={`Remove ${tag} tag`}
            accessibilityRole="button"
            key={tag}
            onPress={() => removeTag(tag)}
          >
            <Text>#{tag} ×</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handleCreate}
        style={{
          marginTop: 16,
          backgroundColor: '#7facddff',
          borderRadius: 8,
          alignItems: 'center',
          padding: 14,
        }}
      >
        <Text>Create post</Text>
      </Pressable>
    </View>
  );
}
