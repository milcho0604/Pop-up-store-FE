export interface PollOptionResDto {
  optionId: number;
  postId: number;
  postTitle: string;
  postImgUrl: string;
  description: string;
  voteCount: number;
  votePercentage: number;
}

export interface PollResDto {
  pollId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  multipleChoice: boolean;
  totalVotes: number;
  isActive: boolean;
  isEnded: boolean;
  options: PollOptionResDto[];
  createdAt: string;
}
