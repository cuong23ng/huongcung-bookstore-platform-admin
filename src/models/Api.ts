export interface BaseResponse<T = any> {
  errorCode?: string;
  message?: string;
  data: T;
}