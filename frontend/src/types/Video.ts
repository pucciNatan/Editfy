export interface Video {
  id: number;
  author: number;
  title: string;
  url: string;
  description: string;
  tags: string[];
  created_at: string; // ISO
  updated_at: string; // ISO
}

