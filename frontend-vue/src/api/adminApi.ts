import axios from 'axios';
import { getTokens } from '@/utils/tokenUtils';

const API_URL = import.meta.env.VITE_BACKEND_URL;

interface User {
  _id: string;
  username: string;
  displayName?: string;
  type: string;
  isAdmin: boolean;
  creationDate: string;
  platformConnections: string[];
  twitterAccount?: any;
  threadsAccount?: any;
  blueskyAccount?: any;
  mastodonAccount?: any;
  tiktokAccount?: any;
  instagramAccount?: any;
  youtubeAccount?: any;
  postStats?: {
    scheduled: { [key: string]: number };
    published: { [key: string]: number };
    draft: { [key: string]: number };
    failed: { [key: string]: number };
  };
}

interface ScheduledPostGroup {
  _id: string;
  userId: User;
  scheduledTime: string;
  platforms: string[];
  sameContent: boolean;
  content: string;
  media: Array<{
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    type: 'image' | 'video';
  }>;
  status:
    | 'draft'
    | 'scheduled'
    | 'published'
    | 'failed'
    | 'partially_published';
  posts: ScheduledPost[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduledPost {
  _id: string;
  postGroupId: ScheduledPostGroup;
  userId: User;
  content: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platformSettings?: {
    tiktok?: {
      viewerSetting?: string;
      allowComments?: boolean;
      allowDuet?: boolean;
      allowStitch?: boolean;
      commercialContent?: boolean;
      brandOrganic?: boolean;
      brandedContent?: boolean;
    };
    instagram?: {
      videoType?: 'REELS' | 'STORIES';
    };
  };
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDetails {
  user: User;
  postBundles: ScheduledPostGroup[];
  posts: ScheduledPost[];
}

export async function getUsers(): Promise<User[]> {
  const tokens = getTokens();
  const response = await axios.get(`${API_URL}/admin/users`, {
    headers: {
      authorization: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
  return response.data;
}

export async function getPostBundles(): Promise<ScheduledPostGroup[]> {
  const tokens = getTokens();
  const response = await axios.get(`${API_URL}/admin/post-bundles`, {
    headers: {
      authorization: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
  return response.data;
}

export async function getPosts(): Promise<ScheduledPost[]> {
  const tokens = getTokens();
  const response = await axios.get(`${API_URL}/admin/posts`, {
    headers: {
      authorization: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });

  return response.data;
}

export async function getUserDetails(userId: string): Promise<UserDetails> {
  const tokens = getTokens();

  try {
    const { data } = await axios.get(
      `${API_URL}/admin/users/${userId}/details`,
      {
        headers: {
          authorization: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

export type { User, ScheduledPostGroup, ScheduledPost, UserDetails };
