import { renderOgImage } from '@portfolio/ui-kit/og';
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { locale, t } from '../../../i18n';
import { groupProjects } from '../../../lib/projects';

/** Social preview for a case page: the project's name under "Work". */
export const getStaticPaths = (async () => {
  const { nowShowing } = groupProjects(await getCollection('projects'));
  return nowShowing.map((project) => ({ params: { slug: project.id }, props: { project } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ project: CollectionEntry<'projects'> }> = ({ props }) => {
  const png = renderOgImage({
    site: 'webenjoyer',
    title: props.project.data.title,
    kicker: t('nav')('work'),
    locale,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
