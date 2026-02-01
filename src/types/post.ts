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
  status: 'ONGOING' | 'UPCOMING' | 'ENDED';
  tags: TagDto[];
}
