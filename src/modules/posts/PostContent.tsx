import { Pressable, Text, View } from 'react-native';

import { PostTags } from './PostTags';
import type { Post } from './types';

type PostContentProps = {
  post: Post;
  onEdit: () => void;
};

export function PostContent({ post, onEdit }: PostContentProps) {
  return (
    <View>
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
      <PostTags tags={post.tags} />

      <Pressable
        accessibilityRole="button"
        onPress={onEdit}
        style={{
          alignSelf: 'flex-start',
          marginTop: 28,
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: '#2563eb',
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Edit</Text>
      </Pressable>
    </View>
  );
}
