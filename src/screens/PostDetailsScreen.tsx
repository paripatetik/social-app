import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../app/navigation/AppNavigator';
import {
  getPostById,
  type Post,
  type PostsResponse,
} from '../shared/api/posts';
import { readLocalDB } from '../shared/api/localDB';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetails'>;

type FormState = {
  title: string;
  body: string;
  tags: string[];
  tagInput: string;
};

async function getPostDetails(postId: number): Promise<Post> {
  const localDB = await readLocalDB();

  if (localDB.deletedPostsIds.includes(postId)) {
    throw new Error('Post was deleted');
  }

  const createdPost = localDB.createdPosts.find(post => post.id === postId);

  if (createdPost) {
    return createdPost;
  }

  const apiPost = await getPostById(postId);

  const editedPost = localDB.editedPosts.find(
    post => post.postId === postId,
  );

  return editedPost
    ? {
        ...apiPost,
        title: editedPost.title ?? apiPost.title,
        body: editedPost.body ?? apiPost.body,
        tags: editedPost.tags ?? apiPost.tags,
      }
    : apiPost;
}

export function PostDetailsScreen({ route }: Props) {
  const { postId } = route.params;

  const queryClient = useQueryClient();
  const initializedPostId = useRef<number | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: '',
    body: '',
    tags: [],
    tagInput: '',
  });

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostDetails(postId),

    // Беремо пост зі списку як стартові дані, щоб екран відкрився швидше.
    initialData: () =>
      queryClient
        .getQueryData<PostsResponse>(['posts'])
        ?.posts.find(post => post.id === postId),
  });

  useEffect(() => {
    if (!post || initializedPostId.current === post.id) {
      return;
    }

    // Заповнюємо форму один раз для цього поста.
    // useRef не дає перезаписати поля, поки користувач редагує.
    setForm({
      title: post.title,
      body: post.body,
      tags: post.tags,
      tagInput: '',
    });

    initializedPostId.current = post.id;
  }, [post]);

  const hasChanges =
    Boolean(post) &&
    (
      form.title.trim() !== post?.title ||
      form.body.trim() !== post?.body ||
      JSON.stringify(form.tags) !== JSON.stringify(post?.tags)
    );

  const canSave =
    hasChanges &&
    form.title.trim().length > 0 &&
    form.body.trim().length > 0;

  function updateForm(changes: Partial<FormState>) {
    setForm(current => ({
      ...current,
      ...changes,
    }));
  }

  function addTag() {
    const tag = form.tagInput
      .trim()
      .replace(/^#/, '')
      .toLowerCase();

    if (!tag || form.tags.includes(tag)) {
      return;
    }

    updateForm({
      tags: [...form.tags, tag],
      tagInput: '',
    });
  }

  function removeTag(tagToRemove: string) {
    updateForm({
      tags: form.tags.filter(tag => tag !== tagToRemove),
    });
  }

  function cancelEditing() {
    if (!post) {
      return;
    }

    setForm({
      title: post.title,
      body: post.body,
      tags: post.tags,
      tagInput: '',
    });

    setIsEditing(false);
  }

  async function handleSave() {
    if (!post || !canSave) {
      return;
    }

    const editedPost = {
      postId: post.id,
      title: form.title.trim(),
      body: form.body.trim(),
      tags: form.tags,
    };

    // Тут пізніше буде mutation:
    // await editPostMutation.mutateAsync(editedPost);

    console.log('Edited post:', editedPost);
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: error ? '#dc2626' : undefined }}>
          {error instanceof Error
            ? error.message
            : 'Post not found'}
        </Text>
      </View>
    );
  }

  const visibleTags = isEditing ? form.tags : post.tags;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          color: '#666',
          marginBottom: 12,
        }}
      >
        User #{post.userId}
      </Text>

      {isEditing ? (
        <>
          <Text style={{ marginBottom: 8 }}>Title</Text>

          <TextInput
            value={form.title}
            onChangeText={title => updateForm({ title })}
            placeholder="Post title"
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 20,
              fontWeight: '600',
            }}
          />

          <Text style={{ marginBottom: 8 }}>Body</Text>

          <TextInput
            value={form.body}
            onChangeText={body => updateForm({ body })}
            placeholder="Post body"
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 140,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <TextInput
              value={form.tagInput}
              onChangeText={tagInput => updateForm({ tagInput })}
              onSubmitEditing={addTag}
              placeholder="Enter tag"
              returnKeyType="done"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
              }}
            />

            <Pressable
              onPress={addTag}
              style={{
                justifyContent: 'center',
                paddingHorizontal: 16,
                backgroundColor: '#ddd',
                borderRadius: 8,
              }}
            >
              <Text>Add</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              marginBottom: 16,
            }}
          >
            {post.title}
          </Text>

          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 20,
            }}
          >
            {post.body}
          </Text>
        </>
      )}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {visibleTags.map(tag => (
          <Pressable
            key={tag}
            disabled={!isEditing}
            onPress={() => removeTag(tag)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: '#e5e7eb',
              borderRadius: 16,
            }}
          >
            <Text>
              #{tag}{isEditing ? ' ×' : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {isEditing ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginTop: 28,
          }}
        >
          <Pressable
            onPress={cancelEditing}
            style={{
              flex: 1,
              padding: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#aaa',
              borderRadius: 8,
            }}
          >
            <Text>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void handleSave();
            }}
            disabled={!canSave}
            style={{
              flex: 1,
              padding: 14,
              alignItems: 'center',
              borderRadius: 8,
              backgroundColor: canSave ? '#2563eb' : '#9ca3af',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontWeight: '600',
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setIsEditing(true)}
          style={{
            alignSelf: 'flex-start',
            marginTop: 28,
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: '#2563eb',
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: '600',
            }}
          >
            Edit
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}