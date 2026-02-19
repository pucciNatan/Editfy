export const mockPortfolioData = {
  id: 1,
  editor_name: "João Silva",
  profile_picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=João",
  banner: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&h=300&fit=crop",
  languages: ["pt-BR", "en-US"],
  price_display: "R$ 150-300/vídeo",
  categories: ["Retail", "Dairy", "E-commerce"],
  tags: ["Reels", "Shorts", "Dinâmico", "Corporativo"],
  biography: "Editor de vídeo profissional com 5+ anos de experiência. Especializado em conteúdo para redes sociais, com foco em engajamento e conversão. Trabalho com diversos nichos, desde varejo até conteúdo corporativo.",
  videos: [
    {
      id: 1,
      title: "Campanha Verão 2024 - Loja de Roupas",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description: "Vídeo promocional para coleção de verão com edição dinâmica e trilha envolvente",
      tags: ["Reels", "Moda", "Dinâmico"],
      categories: ["Retail"]
    },
    {
      id: 2,
      title: "Tutorial Rápido - Produto Lácteo",
      url: "https://www.youtube.com/shorts/abc123",
      description: "Short educativo sobre benefícios do produto",
      tags: ["Shorts", "Tutorial"],
      categories: ["Dairy"]
    },
    {
      id: 3,
      title: "Institucional Empresa Tech",
      url: "https://www.youtube.com/watch?v=example1",
      description: "Vídeo corporativo apresentando valores e cultura da empresa",
      tags: ["Corporativo", "Institucional"],
      categories: ["E-commerce"]
    }
  ],
  recommendation_posts: [
    {
      id: 1,
      author_name: "Maria Santos",
      comment: "Trabalho impecável! O João entregou o projeto antes do prazo e com uma qualidade excepcional. Super recomendo!",
      created_at: "2024-08-15T10:30:00Z"
    },
    {
      id: 2,
      author_name: "Carlos Oliveira",
      comment: "Excelente comunicação e entendimento do briefing. Os vídeos ficaram exatamente como imaginei.",
      created_at: "2024-07-20T14:15:00Z"
    },
    {
      id: 3,
      author_name: "Ana Paula",
      comment: "Profissional dedicado e criativo. Conseguiu transformar nossas ideias em vídeos incríveis!",
      created_at: "2024-06-10T09:45:00Z"
    }
  ]
};
