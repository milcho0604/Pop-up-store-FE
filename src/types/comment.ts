export interface CommentDto {
  id: number;
  nickName: string;
  doctorEmail: string;
  memberId: number | null;
  content: string;
  profileImg: string;
  createdTimeAt: string;
  updatedTimeAt: string;
  PostId: number;
  parentId: number | null;
}

export interface CommentCreateRequest {
  postId: number;
  content: string;
}

export interface ReplyCreateRequest {
  postId: number;
  parentId: number;
  content: string;
}
