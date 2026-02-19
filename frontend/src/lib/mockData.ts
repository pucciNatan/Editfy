export interface Video {
  id: number;
  author: number;
  title: string;
  url: string;
  description: string;
  tags: string[];
  authorName: string;
  authorPhoto: string;
}

export const mockVideos: Video[] = [
  {
    id: 1,
    author: 1,
    title: "Demo Reel 2025",
    url: "https://www.youtube.com/shorts/uA9Zcg3vHvo",
    description: "Seleção de cortes e motion graphics do ano.",
    tags: ["reels", "motion"],
    authorName: "Carlos Silva",
    authorPhoto: "https://i.pravatar.cc/150?img=12"
  },
  {
    id: 2,
    author: 2,
    title: "Vídeo Corporativo Moderno",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Edição profissional para empresas.",
    tags: ["corporativo", "profissional"],
    authorName: "Ana Costa",
    authorPhoto: "https://i.pravatar.cc/150?img=5"
  },
  {
    id: 3,
    author: 3,
    title: "Short Dinâmico",
    url: "https://www.youtube.com/shorts/Vh0qcDerBMc",
    description: "Conteúdo vertical para redes sociais.",
    tags: ["shorts", "social"],
    authorName: "Pedro Martins",
    authorPhoto: "https://i.pravatar.cc/150?img=33"
  },
  {
    id: 4,
    author: 1,
    title: "Tutorial de Edição",
    url: "https://www.youtube.com/watch?v=abc123def456",
    description: "Como fazer transições suaves.",
    tags: ["tutorial", "educativo"],
    authorName: "Carlos Silva",
    authorPhoto: "https://i.pravatar.cc/150?img=12"
  },
  {
    id: 5,
    author: 4,
    title: "Short de Gaming",
    url: "https://www.youtube.com/shorts/xyz789",
    description: "Montagem rápida de gameplay.",
    tags: ["gaming", "shorts"],
    authorName: "Marina Souza",
    authorPhoto: "https://i.pravatar.cc/150?img=9"
  },
  {
    id: 6,
    author: 2,
    title: "Documentário Curto",
    url: "https://www.youtube.com/watch?v=doc123",
    description: "Narrativa visual impactante.",
    tags: ["documentário", "narrativa"],
    authorName: "Ana Costa",
    authorPhoto: "https://i.pravatar.cc/150?img=5"
  },
  {
    id: 7,
    author: 5,
    title: "Reels de Viagem",
    url: "https://www.youtube.com/shorts/travel123",
    description: "Aventuras pelo mundo em formato vertical.",
    tags: ["viagem", "shorts"],
    authorName: "Lucas Oliveira",
    authorPhoto: "https://i.pravatar.cc/150?img=15"
  },
  {
    id: 8,
    author: 3,
    title: "Vídeo Musical",
    url: "https://www.youtube.com/watch?v=music456",
    description: "Clipe profissional com efeitos especiais.",
    tags: ["música", "clipe"],
    authorName: "Pedro Martins",
    authorPhoto: "https://i.pravatar.cc/150?img=33"
  }
];

export const getVideoEmbedUrl = (url: string): string => {
  const videoId = url.split('/').pop()?.split('?')[0] || '';
  
  if (url.includes('shorts')) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  const watchId = url.includes('watch?v=') 
    ? url.split('watch?v=')[1]?.split('&')[0] 
    : videoId;
    
  return `https://www.youtube.com/embed/${watchId}`;
};

export const isVerticalVideo = (url: string): boolean => {
  return url.includes('shorts');
};
