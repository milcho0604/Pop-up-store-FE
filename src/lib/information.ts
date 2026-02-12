import { api, ApiResponse } from './api';
import { InformationListDto } from '@/types/member';

export const informationApi = {
  getMyList: (token: string) =>
    api.withAuth(token).get<ApiResponse<InformationListDto[]>>('/info/my/list'),
};
