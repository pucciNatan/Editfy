export interface Job {
  id: number;
  title: string;
  type: "FREELANCE" | "FIXED" | "HOURLY";
  work_mode: "REMOTE" | "HYBRID" | "ONSITE";
  location: string;
  payment_display: string;
  fixed_payment?: number;
  video_duration: string;
  description: string;
  video_example_urls: string[];
  tags: string[];
  applications_count: number;
  contractor_id: number;
  contractor_name: string;
  contractor_avatar: string;
  has_applied?: boolean;
  my_application_id?: number | null;

  created_at: string;
}

export const mockJobs: Job[] = [
  {
    id: 1,
    title: "Editor para Vídeos de Culinária",
    type: "FREELANCE",
    work_mode: "REMOTE",
    location: "São Paulo - SP",
    payment_display: "R$ 200-350/vídeo",
    fixed_payment: 275,
    video_duration: "5-8min",
    description: "Procuro editor experiente para criar vídeos dinâmicos de receitas para YouTube e Instagram. Necessário experiência com motion graphics e edição rápida para redes sociais.",
    video_example_urls: [
      "https://www.youtube.com/watch?v=example1",
      "https://www.youtube.com/watch?v=example2"
    ],
    tags: ["culinaria", "receitas", "reels"],
    applications_count: 5,
    contractor_id: 1,
    contractor_name: "Maria Oliveira",
    contractor_avatar: "https://i.pravatar.cc/150?img=10",
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    title: "Montagem de Vlogs de Viagem",
    type: "FIXED",
    work_mode: "REMOTE",
    location: "Rio de Janeiro - RJ",
    payment_display: "R$ 500/projeto",
    fixed_payment: 500,
    video_duration: "10-15min",
    description: "Preciso de um editor para compilar e editar vlogs de viagem. Estilo documental com trilha emocional.",
    video_example_urls: [
      "https://www.youtube.com/watch?v=travel1"
    ],
    tags: ["viagem", "vlogs", "documental"],
    applications_count: 12,
    contractor_id: 2,
    contractor_name: "Carlos Santos",
    contractor_avatar: "https://i.pravatar.cc/150?img=20",
    created_at: "2024-01-14T14:20:00Z"
  },
  {
    id: 3,
    title: "Shorts para Canal de Tecnologia",
    type: "FREELANCE",
    work_mode: "REMOTE",
    location: "Nacional",
    payment_display: "R$ 100-150/short",
    video_duration: "30-60s",
    description: "Canal de tech precisa de editor para criar shorts diários. Cortes rápidos, legendas animadas e efeitos modernos.",
    video_example_urls: [
      "https://www.youtube.com/shorts/tech1",
      "https://www.youtube.com/shorts/tech2"
    ],
    tags: ["tecnologia", "shorts", "legendas"],
    applications_count: 8,
    contractor_id: 1,
    contractor_name: "Maria Oliveira",
    contractor_avatar: "https://i.pravatar.cc/150?img=10",
    created_at: "2024-01-13T09:15:00Z"
  },
  {
    id: 4,
    title: "Vídeos Corporativos Institucionais",
    type: "HOURLY",
    work_mode: "HYBRID",
    location: "Belo Horizonte - MG",
    payment_display: "R$ 80/hora",
    video_duration: "3-5min",
    description: "Empresa de consultoria busca editor para vídeos institucionais. Necessário experiência com motion design e animações corporativas.",
    video_example_urls: [],
    tags: ["corporativo", "institucional", "motion"],
    applications_count: 3,
    contractor_id: 3,
    contractor_name: "Roberto Almeida",
    contractor_avatar: "https://i.pravatar.cc/150?img=30",
    created_at: "2024-01-12T16:45:00Z"
  },
  {
    id: 5,
    title: "Edição de Podcast com Cortes",
    type: "FIXED",
    work_mode: "REMOTE",
    location: "Nacional",
    payment_display: "R$ 300/episódio",
    fixed_payment: 300,
    video_duration: "45-60min",
    description: "Podcast semanal precisa de editor para fazer cortes, adicionar vinhetas e criar clipes para redes sociais.",
    video_example_urls: [
      "https://www.youtube.com/watch?v=podcast1"
    ],
    tags: ["podcast", "cortes", "social"],
    applications_count: 15,
    contractor_id: 2,
    contractor_name: "Carlos Santos",
    contractor_avatar: "https://i.pravatar.cc/150?img=20",
    created_at: "2024-01-11T11:30:00Z"
  },
  {
    id: 6,
    title: "Reels para E-commerce de Moda",
    type: "FREELANCE",
    work_mode: "REMOTE",
    location: "São Paulo - SP",
    payment_display: "R$ 150-200/reel",
    video_duration: "15-30s",
    description: "Loja online de moda busca editor criativo para reels de produtos. Estilo moderno e tendências atuais.",
    video_example_urls: [
      "https://www.youtube.com/shorts/fashion1",
      "https://www.youtube.com/shorts/fashion2"
    ],
    tags: ["moda", "reels", "ecommerce"],
    applications_count: 20,
    contractor_id: 4,
    contractor_name: "Juliana Lima",
    contractor_avatar: "https://i.pravatar.cc/150?img=40",
    created_at: "2024-01-10T13:00:00Z"
  },
  {
    id: 7,
    title: "Editor para Canal de Games",
    type: "FREELANCE",
    work_mode: "REMOTE",
    location: "Nacional",
    payment_display: "R$ 250-400/vídeo",
    video_duration: "12-20min",
    description: "Canal de gameplay e análises de jogos procura editor. Conhecimento em edição de gameplay e memes é essencial.",
    video_example_urls: [
      "https://www.youtube.com/watch?v=gaming1"
    ],
    tags: ["games", "gameplay", "entretenimento"],
    applications_count: 18,
    contractor_id: 3,
    contractor_name: "Roberto Almeida",
    contractor_avatar: "https://i.pravatar.cc/150?img=30",
    created_at: "2024-01-09T15:20:00Z"
  }
];

export const mockContractorPortfolio = {
  id: 1,
  contractor_name: "Maria Oliveira",
  profile_picture: "https://i.pravatar.cc/150?img=10",
  banner: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=300&fit=crop",
  language: "pt-BR",
  price_display: "R$ 100-500/projeto",
  categories: ["Culinária", "Tecnologia", "E-commerce"],
  tags: ["shorts", "reels", "corporativo"],
  biography: "Produtora de conteúdo há 8 anos, especializada em vídeos para YouTube e redes sociais. Trabalho com diversos nichos e busco sempre os melhores editores para entregar qualidade aos meus clientes.",
  jobs: mockJobs.filter(job => job.contractor_id === 1)
};
