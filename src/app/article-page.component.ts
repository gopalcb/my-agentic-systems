import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { ARTICLES, Article } from './articles';

type ViewArticle = Article & {
  trustedDiagram: SafeResourceUrl;
};

@Component({
  selector: 'app-article-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive],
  template: `
    <section class="article-shell">
      <aside class="article-nav" aria-label="Articles">
        <p class="section-kicker">Articles</p>
        <h1>Agentic system development</h1>
        <nav>
          <a
            *ngFor="let item of articles"
            [routerLink]="['/articles', item.slug]"
            routerLinkActive="active"
            [attr.aria-label]="item.title"
          >
            <span>{{ item.title }}</span>
          </a>
        </nav>
      </aside>

      <article class="article-panel" *ngIf="article as current">
        <header class="article-header">
          <p class="eyebrow">{{ current.kicker }} · {{ current.readingTime }}</p>
          <h2>{{ current.title }}</h2>
          <p class="lede">{{ current.summary }}</p>
        </header>

        <figure class="diagram-frame">
          <iframe [src]="current.trustedDiagram" [title]="current.diagramAlt"></iframe>
          <figcaption>{{ current.diagramAlt }}</figcaption>
        </figure>

        <section class="content-section" *ngFor="let section of current.sections">
          <h3>{{ section.heading }}</h3>
          <p *ngFor="let paragraph of section.paragraphs">{{ paragraph }}</p>
          <ul *ngIf="section.bullets?.length">
            <li *ngFor="let bullet of section.bullets">{{ bullet }}</li>
          </ul>
        </section>

        <section class="example-block" *ngIf="current.example">
          <h3>{{ current.example.title }}</h3>
          <pre><code>{{ current.example.code }}</code></pre>
        </section>
      </article>
    </section>
  `,
})
export class ArticlePageComponent {
  readonly articles: ViewArticle[];
  article: ViewArticle;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    this.articles = ARTICLES.map((article) => ({
      ...article,
      trustedDiagram: this.sanitizer.bypassSecurityTrustResourceUrl(article.diagram),
    }));
    this.article = this.articles[0];

    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? ARTICLES[0].slug;
      const article = this.articles.find((item) => item.slug === slug);
      if (!article) {
        void this.router.navigate(['/articles', ARTICLES[0].slug], { replaceUrl: true });
        return;
      }
      this.article = article;
    });
  }
}
