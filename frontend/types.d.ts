export interface User {
  _id: string;
  username: string;
  email: string;
  password?: string;
  profilePicture?: string;
  bio?: string;
  followers: string[];
  following: string[];
  posts: Post[];
  savedPosts: string[] | Post[];
  isVerified: boolean;
}

export interface Comment {
  _id: string;
  text: string;
  user: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  createdAt: string;
}

export interface Post {
  _id: string;
  caption: string;
  image?: {
    url: string;
    publicId: string;
  };

  user: User | undefined;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}
