import { Routes } from '@angular/router';

import { ArticlePageComponent } from './article-page.component';
import { ARTICLES } from './articles';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: `articles/${ARTICLES[0].slug}` },
  { path: 'articles/:slug', component: ArticlePageComponent },
  { path: '**', redirectTo: `articles/${ARTICLES[0].slug}` },
];
