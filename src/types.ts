export interface UserProfile {
  userId: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  interests: string[];
  preferredLanguages: string[];
  createdAt: number;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  languages: string[];
  language?: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  commit_count?: number;
}

export interface GithubUser {
  login: string;
  avatar_url: string;
  name?: string;
  bio?: string;
  location?: string;
  blog?: string;
  twitter_username?: string;
  followers: number;
  following: number;
  html_url: string;
}

export type InteractionType = 'like' | 'pass' | 'superlike' | 'open';

export interface Interaction {
  userId: string;
  repoId: string;
  repoData: Repository;
  type: InteractionType;
  timestamp: number;
}

export interface CuratedList {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  repoIds: string[];
  repos: Repository[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Follow {
  followerId: string;
  followedUserId?: string;
  listId: string;
  timestamp: number;
}
