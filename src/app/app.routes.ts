import { Routes } from '@angular/router';

import { ArticlePageComponent } from './article-page.component';
import { ARTICLES } from './articles';
import { ControllerDemoComponent } from './controller-demo/controller-demo.component';
import { controllerDemoRoutes } from './controller-demo/controller-demo.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: `articles/${ARTICLES[0].slug}` },
  { path: 'controller-plane-ui-demo', component: ControllerDemoComponent, children: controllerDemoRoutes },
  { path: 'articles/:slug', component: ArticlePageComponent },
  { path: '**', redirectTo: `articles/${ARTICLES[0].slug}` },
];
