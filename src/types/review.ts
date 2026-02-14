export interface ReviewResDto {
  reviewId: number;
  postId: number;
  postTitle: string;
  memberId: number;
  memberNickname: string;
  memberProfileImg: string;
  content: string;
  satisfaction: number;
  waitingTime: number;
  photoAvailability: number;
  rating: number;
  reviewImgUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateReqDto {
  content: string;
  satisfaction: number;
  waitingTime: number;
  photoAvailability: number;
}
