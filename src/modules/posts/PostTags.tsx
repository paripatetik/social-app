import { Pressable, Text, View } from 'react-native';

type PostTagsProps = {
  tags: string[];
  editable?: boolean;
  onRemove?: (tag: string) => void;
};

export function PostTags({
  tags,
  editable = false,
  onRemove,
}: PostTagsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {tags.map(tag => (
        <Pressable
          key={tag}
          accessibilityLabel={editable ? `Remove ${tag} tag` : undefined}
          accessibilityRole={editable ? 'button' : undefined}
          disabled={!editable}
          onPress={() => onRemove?.(tag)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#e5e7eb',
            borderRadius: 16,
            marginTop: 8,
          }}
        >
          <Text>
            #{tag}
            {editable ? ' ×' : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
