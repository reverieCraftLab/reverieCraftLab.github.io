import { getCollection, type CollectionEntry } from 'astro:content';

export const site = {
  title: 'Reverie Craft Lab',
  tagline: '백엔드 작업 기록',
  intro: '5년 넘게 개발했지만, 설명할 수 있는 게 없었습니다. 이제 하나씩 기록합니다.',
  author: 'reverieCraftLab',
  github: 'https://github.com/reverieCraftLab',
  email: 'seogwotan@gmail.com',
};

export const profile = {
  name: '서권탁',
  eyebrow: 'BACKEND DEVELOPER / 2026',
  birth: '1997.03.23',
  city: 'Seoul',
  role: 'Backend Developer',
  roleNote: 'Freelance',
  focus: ['Spring Boot 3', 'JPA', 'PostgreSQL', 'Supabase', 'AWS EC2'],
};

export const kinds = {
  note: { label: '기술 노트', path: '/notes/' },
  devlog: { label: '개발 일지', path: '/devlog/' },
} as const;

export type Post = CollectionEntry<'posts'>;

/** 시리즈 정보. planned는 아직 쓰지 않은 편이고, 글을 발행하면 여기서 지운다. */
export const seriesList = [
  {
    id: 'smartfarm-replay',
    title: '스마트팜 가상 온실 리플레이',
    description:
      '스마트팜코리아 Open API로 실제 작기 데이터를 모으고, 시간을 압축해 다시 흘려보내는 가상 온실을 만드는 과정.',
    status: '설계 단계',
    ai: {
      design: 'Claude Fable 5.2',
      dev: '구현 시작 전',
      note: '명세서 분석과 설계 초안은 Claude와 대화하며 만들었다. 구현에 쓴 모델은 개발 일지마다 적는다.',
    },
    planned: [
      { order: 5, title: '저장된 작기를 다시 흘려보내는 리플레이 엔진' },
      { order: 6, title: 't2.micro 한 대에 올리기' },
    ],
  },
];

export const projects = [
  {
    title: '스마트팜 가상 온실 리플레이',
    period: '2026.11 ~',
    status: '설계 단계',
    ai: { design: 'Claude Fable 5.2', dev: '구현 시작 전' },
    stack: ['Spring Boot 3', 'JPA', 'JdbcTemplate', 'PostgreSQL', 'SSE'],
    summary:
      '공공 Open API의 실제 작기 데이터를 페이지 단위로 수집해 저장하고, 가상 시계에 맞춰 다시 재생한다. 재시작 가능한 수집기와 측정값 테이블 설계가 중심이다.',
    links: [{ label: '시리즈 글 보기', href: '/series/smartfarm-replay/' }],
  },
  {
    title: 'React 학습 기록',
    period: '2026.02',
    status: '완료',
    ai: undefined as { design?: string; dev?: string } | undefined,
    stack: ['React', 'JSX', 'Hooks'],
    summary: 'React 기초부터 TODO 리스트, 코인 시세 조회까지 단계별로 만든 학습용 프로젝트 모음.',
    links: [
      { label: '학습 기록 페이지', href: '/react-study/' },
      { label: '소스코드', href: 'https://github.com/reverieCraftLab/react' },
    ],
  },
];

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function seriesParts(posts: Post[], id: string) {
  const meta = seriesList.find((s) => s.id === id);
  const written = posts
    .filter((p) => p.data.series?.id === id)
    .map((p) => ({ order: p.data.series!.order, title: p.data.title, post: p as Post | null }));
  const planned = (meta?.planned ?? []).map((p) => ({ ...p, post: null as Post | null }));
  return [...written, ...planned].sort((a, b) => a.order - b.order);
}

export function formatDate(d: Date) {
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function readingMinutes(body: string | undefined) {
  const chars = (body ?? '').replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / 600));
}

export function tagCounts(posts: Post[]) {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'));
}
