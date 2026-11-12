import rss from '@astrojs/rss';
import { getPosts, site } from '../data/site';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: site.title,
    description: site.intro,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
    })),
  });
}
