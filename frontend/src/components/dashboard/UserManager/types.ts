import { User } from '../../../types/dashboard';

export interface UserData extends User {}

export interface NewUserForm {
  email: string;
  password: string;
  role: string;
  room?: string;
}

export interface EditUserData {
  email: string;
  password: string;
  room?: string;
}

export type FilterRole = 'all' | 'admin' | 'user';
export type ViewMode = 'grid' | 'table';

export type SortKey = keyof UserData | 'devices' | 'room';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}
