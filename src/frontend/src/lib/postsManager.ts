export interface Post {
  id: string;
  title: string;
  tagline?: string;
  content: string;
  imageUrl: string; // base64 data URL or empty string
  isPromotional: boolean;
  createdAt: number;
}

const KEY = "t77_posts";

export function getPosts(): Post[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePost(post: Omit<Post, "id" | "createdAt">): Post {
  const posts = getPosts();
  const newPost: Post = {
    ...post,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    createdAt: Date.now(),
  };
  posts.unshift(newPost);
  localStorage.setItem(KEY, JSON.stringify(posts));
  return newPost;
}

export function updatePost(
  id: string,
  updates: Partial<Omit<Post, "id" | "createdAt">>,
): boolean {
  const posts = getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  posts[idx] = { ...posts[idx], ...updates };
  localStorage.setItem(KEY, JSON.stringify(posts));
  return true;
}

export function deletePost(id: string): void {
  const posts = getPosts().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(posts));
}
