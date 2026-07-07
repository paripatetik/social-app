# Social App

Застосунок на **Expo + React Native + TypeScript** для роботи зі стрічкою постів і коментарями.

## Функціональність

У застосунку реалізовано:

* перегляд стрічки постів;
* infinite scroll і pull-to-refresh;
* перегляд деталей поста;
* створення, редагування й видалення постів;
* перегляд коментарів;
* додавання локального коментаря;
* збереження локальних змін після перезапуску застосунку.

## Архітектура

У проєкті використано **feature-based modular architecture**.

Код поділений за функціональними модулями:

src/
  app/
    navigation/
      AppNavigator.tsx

  screens/
    FeedScreen.tsx
    PostDetailsScreen.tsx
    CreatePostScreen.tsx

  modules/
    posts/
      api.ts
      hooks.ts
      repository.ts
      storage.ts
      types.ts
      PostContent.tsx
      PostEditForm.tsx
      PostTags.tsx

    comments/
      api.ts
      hooks.ts
      repository.ts
      storage.ts
      types.ts
      CommentSection.tsx

`app/` містить інфраструктурний код застосунку, зокрема навігацію.

`screens/` містить екрани, підключені до React Navigation.

`modules/posts/` містить усе, що стосується постів: типи, API-запити, локальне сховище, repository-шар, React Query hooks і UI-компоненти.

`modules/comments/` побудований аналогічно, але відповідає за коментарі.

Feature-Sliced Design не використовувався, бо для цього проєкту достатньо простішої модульної структури без окремих шарів `entities`, `features`, `widgets` і `shared`.

## State management

Окремий state manager на кшталт Redux або Zustand не використовується.

У проєкті є три типи стану:

### Server state

Для даних із API використовується TanStack Query.

Він відповідає за:

* завантаження й кешування даних;
* refetch;
* infinite query;
* invalidation;
* optimistic updates.

Основні hooks для постів:

usePosts()
usePostDetails(postId)
useCreatePost()
useEditPost()
useDeletePost()

Основні hooks для коментарів:

usePostComments(postId)
useCreateComment(postId)

### 2. Local UI state

Для стану форм і локальної поведінки компонентів використовується `useState` і `useRef`.

Цей стан не винесено в глобальний store, бо він потрібен тільки в межах конкретного екрана або компонента.

### 3. Persistent local state

Для даних, які мають залишатися після перезапуску застосунку, використовується `AsyncStorage`.

Для постів використовується один ключ: localDB.

У ньому зберігаються не всі пости, а тільки локальні зміни:

type PostsLocalDB = {
  createdPosts: Post[];
  editedPosts: EditedPost[];
  deletedPostsIds: number[];
};


Коментарі зберігаються окремо для кожного поста за ключем: comments:${postId}.


Тобто для постів `AsyncStorage` зберігає локальні зміни до стрічки, а для коментарів — окремі локальні списки для кожного `postId`.

## Data flow

Основний потік даних:

Screen
  -> React Query hook
    -> repository
      -> API
      -> AsyncStorage
    -> merged data
  -> UI

Repository-шар поєднує дані з API та локальні зміни з `AsyncStorage`.

Для стрічки це виглядає так:

FeedScreen
  -> usePosts()
    -> getFeedPosts()
      -> API posts
      -> localDB
      -> filter deleted posts
      -> apply edited posts
      -> add created posts
  -> FlatList

Для деталей поста:

PostDetailsScreen
  -> usePostDetails(postId)
    -> getPostDetails(postId)
      -> check deletedPostsIds
      -> check createdPosts
      -> fetch API post
      -> apply editedPost
  -> PostContent / PostEditForm

Для коментарів:

CommentSection
  -> usePostComments(postId)
    -> getCommentsForPost(postId)
      -> API comments
      -> local comments from AsyncStorage
      -> merged comments
  -> comments list

## Optimistic Updates

У проєкті optimistic updates реалізовані для постів через TanStack Query mutations.

### Створення поста

`useCreatePost()` одразу додає новий пост на початок кешованої стрічки. Якщо mutation завершується помилкою, попередній кеш повертається назад. Після завершення mutation список постів інвалідується.

mutate(newPost)
  -> save previous cache
  -> insert new post into cache
  -> mutationFn
  -> rollback on error
  -> invalidate posts

### Видалення поста

`useDeletePost()` одразу прибирає пост з кешу всіх сторінок і зменшує `total`. Якщо виникає помилка, попередній кеш відновлюється.

### Редагування поста

`useEditPost()` оновлює і кеш списку постів, і кеш деталей конкретного поста. Завдяки цьому користувач одразу бачить нові `title`, `body` і `tags` як у стрічці, так і на екрані деталей.

Для коментарів optimistic update не використовується. Після створення локального коментаря query коментарів інвалідується, і список перечитується з repository-шару.

## API

Для постів реалізовано:

getPosts(skip, limit)
getPostById(postId)
createPost(post)
editPost(postId, updatedPost)
deletePost(postId)

Для коментарів:

getPostComments(postId)

## Навігація

Навігація реалізована через `@react-navigation/native` і `@react-navigation/native-stack`.

У застосунку є три екрани:

Feed
PostDetails
CreatePost

Тип параметрів навігації:

export type RootStackParamList = {
  Feed: undefined;
  PostDetails: { postId: number };
  CreatePost: undefined;
};

## Запуск проєкту

Встановити залежності:

npm install

Запустити Expo dev server:

npm start

Запуск на Android:

npm run android

Запуск на iOS:

npm run ios

Запуск web-версії:

npm run web

Для запуску на телефоні можна використати Expo Go через QR-код. 
