export interface TagDto {
  id: number;
  name: string;
  usageCount: number;
}

export interface PostListDto {
  id: number;
  memberEmail: string;
  memberNickname: string;
  title: string;
  content: string;
  likeCount: number;
  viewCount: number;
  createdTimeAt: string;
  postImgUrl: string;
  startDate: string;
  endDate: string;
  city: string;
  dong: string;
  street: string;
  zipcode: string;
  detailAddress: string;
  category: string;
  status: string;
  tags: TagDto[];
}

export interface OperatingHoursDto {
  open: string;
  close: string;
  closed?: boolean;
}

export interface BusinessInfoDto {
  postDetailId: number;
  postId: number;
  operatingHours: Record<string, OperatingHoursDto>;
  dayOff: string;
  entryFee: string;
  parkingAvailable: boolean;
  parkingFee: string;
  nearbySubway: string;
  nearbySubwayExit: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilterReqDto {
  keyword?: string;
  categories?: string[];
  statuses?: string[];
  city?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'LATEST' | 'POPULAR' | 'VIEW_COUNT' | 'ENDING_SOON';
}

export interface PostCreateReqDto {
  memberEmail: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  city?: string;
  dong?: string;
  street?: string;
  zipcode?: string;
  detailAddress?: string;
  category?: string;
  tagNames?: string[];
}

export interface PostDetailDto {
  id: number;
  memberEmail: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  title: string;
  content: string;
  profileImgUrl: string;
  postImgUrl: string;
  likeCount: number;
  viewCount: number;
  createdTimeAt: string;
  updatedTimeAt: string;
  startDate: string;
  endDate: string;
  city: string;
  dong: string;
  street: string;
  zipcode: string;
  detailAddress: string;
  category: string;
  status: string;
  tags: TagDto[];
  businessInfo: BusinessInfoDto | null;
}
