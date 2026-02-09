import { TagDto } from './post';

export interface SignupRequest {
  name: string;
  nickname: string;
  memberEmail: string;
  password: string;
  phoneNumber: string;
}

export interface MemberProfileResDto {
  id: number;
  memberEmail: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  profileImgUrl: string;
  city: string | null;
  dong: string | null;
  street: string | null;
  zipcode: string | null;
  detailAddress: string | null;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfileUpdateReqDto {
  name?: string;
  nickname?: string;
  phoneNumber?: string;
  city?: string;
  dong?: string;
  street?: string;
  zipcode?: string;
  detailAddress?: string;
  password?: string;
  confirmPassword?: string;
}

export interface FavoriteResDto {
  favoriteId: number;
  postId: number;
  postTitle: string;
  postContent: string;
  postImgUrl: string;
  category: string;
  startDate: string;
  endDate: string;
  city: string;
  street: string;
  zipcode: string;
  favoritedAt: string;
}

export interface InformationListDto {
  id: number;
  reporterEmail: string;
  reporterNickname: string;
  title: string;
  content: string;
  postImgUrl: string;
  createdTimeAt: string;
  startDate: string;
  endDate: string;
  city: string;
  dong: string;
  street: string;
  zipcode: string;
  detailAddress: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  category: string;
  tags: TagDto[];
}

export interface FollowStatsDto {
  memberId: number;
  followerCount: number;
  followingCount: number;
}
