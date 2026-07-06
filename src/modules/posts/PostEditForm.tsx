import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { PostTags } from './PostTags';
import type { EditedPost, Post } from './types';

type PostEditFormProps = {
  post: Post;
  isSaving?: boolean;
  onCancel: () => void;
  onSave: (editedPost: EditedPost) => void;
};

type PostDraft = Pick<Post, 'title' | 'body' | 'tags'>;

export function PostEditForm({
  post,
  isSaving = false,
  onCancel,
  onSave,
}: PostEditFormProps) {
  const [draft, setDraft] = useState<PostDraft>({
    title: post.title,
    body: post.body,
    tags: post.tags,
  });

  const [tagInput, setTagInput] = useState('');

  const hasChanges =
    draft.title.trim() !== post.title ||
    draft.body.trim() !== post.body ||
    JSON.stringify(draft.tags) !== JSON.stringify(post.tags);

  const canSave =
    hasChanges &&
    draft.title.trim().length > 0 &&
    draft.body.trim().length > 0 &&
    !isSaving;

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase();

    if (!tag || draft.tags.includes(tag)) {
      return;
    }

    setDraft(current => ({
      ...current,
      tags: [...current.tags, tag],
    }));
    setTagInput('');
  }

  return (
    <View>
      <Text style={{ marginBottom: 8 }}>Title</Text>
      <TextInput
        value={draft.title}
        onChangeText={title =>
          setDraft(current => ({ ...current, title }))
        }
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
        value={draft.body}
        onChangeText={body =>
          setDraft(current => ({ ...current, body }))
        }
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
          value={tagInput}
          onChangeText={setTagInput}
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
          accessibilityRole="button"
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

      <PostTags
        tags={draft.tags}
        editable
        onRemove={tagToRemove =>
          setDraft(current => ({
            ...current,
            tags: current.tags.filter(tag => tag !== tagToRemove),
          }))
        }
      />

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          marginTop: 28,
        }}
      >
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onCancel}
          style={{
            flex: 1,
            padding: 14,
            alignItems: 'center',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#aaa',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          <Text>Cancel</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={() =>
            onSave({
              postId: post.id,
              title: draft.title.trim(),
              body: draft.body.trim(),
              tags: draft.tags,
            })
          }
          style={{
            flex: 1,
            padding: 14,
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: canSave ? '#2563eb' : '#9ca3af',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
