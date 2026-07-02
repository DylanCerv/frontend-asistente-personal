export type ApiUser = {
  id: string;
  email: string;
  roleId: number;
  role: { id: number; name: string };
  profile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
};

export type ApiSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
};

export type AuthPayload = {
  user: ApiUser;
  session: ApiSession;
};

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    code?: string;
  };
};

export type ApiDataResponse<T> = {
  success: true;
  data: T;
};
