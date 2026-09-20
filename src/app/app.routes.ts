import { Routes } from '@angular/router';

import { ArticlePageComponent } from './article-page.component';
import { ARTICLE_GROUPS } from './articles';
import { ControllerDemoComponent } from './controller-demo/controller-demo.component';
import { controllerDemoRoutes } from './controller-demo/controller-demo.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: ARTICLE_GROUPS[0].defaultArticleSlug,
  },
  { path: 'controller-plane-ui-demo', component: ControllerDemoComponent, children: controllerDemoRoutes },
  { path: ':section/articles/:slug', component: ArticlePageComponent, data: { legacyArticleRoute: true } },
  { path: 'articles/:slug', component: ArticlePageComponent, data: { legacyArticleRoute: true } },
  { path: ':slug', component: ArticlePageComponent },
  { path: '**', redirectTo: ARTICLE_GROUPS[0].defaultArticleSlug },
];
