import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Pressable, Text } from 'react-native';
import { CreatePostScreen } from '../../screens/CreatePostScreen';

import { FeedScreen } from '../../screens/FeedScreen';
import { PostDetailsScreen } from '../../screens/PostDetailsScreen';

export type RootStackParamList = {
  Feed: undefined;
  PostDetails: { postId: number };
  CreatePost: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        
        <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={({ navigation }) => ({
          title: 'Posts',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('CreatePost')}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ fontWeight: '600' }}>Create Post</Text>
            </Pressable>
          ),
        })}
      />

        <Stack.Screen
          name="PostDetails"
          component={PostDetailsScreen}
          options={{ title: 'Post details' }}
        />

        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ title: 'New post' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

