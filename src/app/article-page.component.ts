import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { ARTICLE_GROUPS, ARTICLES, Article, ArticleGroup, ArticleGroupSlug } from './articles';

type ViewDiagram = {
  src: SafeResourceUrl;
  alt: string;
  size?: 'short' | 'medium' | 'tall';
};

type ViewArticle = Article & {
  trustedDiagram: ViewDiagram;
  sections: Array<
    Article['sections'][number] & {
      trustedDiagram?: ViewDiagram;
      htmlParagraphs: string[];
      htmlBullets?: string[];
    }
  >;
};

@Component({
  selector: 'app-article-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive],
  template: `
    <section class="article-shell">
      <aside class="article-nav" aria-label="Articles">
        <a
          *ngIf="showControllerDemoLink"
          class="controller-demo-link"
          routerLink="/controller-plane-ui-demo"
          routerLinkActive="active"
        >
          <span class="demo-link-title">Controller plane UI demo</span>
          <span class="demo-link-subtitle">
            View the agent systems controller plane UI with mock data for a high level functional overview.
          </span>
        </a>
        <p class="section-kicker">{{ activeGroup.kicker }}</p>
        <h1>{{ activeGroup.title }}</h1>
        <p class="article-nav-summary">{{ activeGroup.description }}</p>
        <nav>
          <a
            *ngFor="let item of articles"
            [routerLink]="['/', item.slug]"
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

        <figure class="diagram-frame" [class.diagram-frame-tall]="current.trustedDiagram.size === 'tall'" [class.diagram-frame-short]="current.trustedDiagram.size === 'short'">
          <iframe [src]="current.trustedDiagram.src" [title]="current.trustedDiagram.alt" scrolling="no"></iframe>
          <figcaption>{{ current.trustedDiagram.alt }}</figcaption>
        </figure>

        <section class="content-section" *ngFor="let section of current.sections">
          <h3>{{ section.heading }}</h3>
          <p *ngFor="let paragraph of section.htmlParagraphs" [innerHTML]="paragraph"></p>
          <ul *ngIf="section.bullets?.length">
            <li *ngFor="let bullet of section.htmlBullets" [innerHTML]="bullet"></li>
          </ul>
          <figure
            class="diagram-frame section-diagram"
            *ngIf="section.trustedDiagram"
            [class.diagram-frame-tall]="section.trustedDiagram.size === 'tall'"
            [class.diagram-frame-short]="section.trustedDiagram.size === 'short'"
          >
            <iframe [src]="section.trustedDiagram.src" [title]="section.trustedDiagram.alt" scrolling="no"></iframe>
            <figcaption>{{ section.trustedDiagram.alt }}</figcaption>
          </figure>
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
  readonly allArticles: ViewArticle[];
  articles: ViewArticle[];
  activeGroup: ArticleGroup;
  article: ViewArticle;
  showControllerDemoLink = true;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    this.allArticles = ARTICLES.map((article) => ({
      ...article,
      trustedDiagram: {
        src: this.sanitizer.bypassSecurityTrustResourceUrl(article.diagram),
        alt: article.diagramAlt,
        size: article.diagramSize,
      },
      sections: article.sections.map((section) => ({
        ...section,
        htmlParagraphs: section.paragraphs.map((paragraph) => this.renderInlineCode(paragraph)),
        htmlBullets: section.bullets?.map((bullet) => this.renderInlineCode(bullet)),
        trustedDiagram: section.diagram
          ? {
              src: this.sanitizer.bypassSecurityTrustResourceUrl(section.diagram.src),
              alt: section.diagram.alt,
              size: section.diagram.size,
            }
          : undefined,
      })),
    }));
    this.activeGroup = ARTICLE_GROUPS[0];
    this.articles = this.articlesForGroup(this.activeGroup.slug);
    this.article = this.articles[0];

    this.route.paramMap.subscribe((params) => {
      const requestedSection = params.get('section') as ArticleGroupSlug | null;
      const requestedSlug = params.get('slug');
      const requestedArticle = requestedSlug ? this.allArticles.find((item) => item.slug === requestedSlug) : undefined;
      const group = this.resolveGroup(requestedSection, requestedArticle?.groupSlug ?? 'codex-agent-system');
      const slug = requestedSlug ?? group.defaultArticleSlug;
      const articleFromSlug = this.allArticles.find((item) => item.slug === slug);
      const isLegacyArticleRoute = Boolean(this.route.snapshot.data['legacyArticleRoute']);

      if (!articleFromSlug) {
        void this.router.navigate(this.articleRoute(group.defaultArticleSlug), { replaceUrl: true });
        return;
      }

      if (isLegacyArticleRoute || (requestedSection && articleFromSlug.groupSlug !== group.slug)) {
        void this.router.navigate(this.articleRoute(articleFromSlug.slug), { replaceUrl: true });
        return;
      }

      this.activeGroup = group;
      this.articles = this.articlesForGroup(group.slug);
      this.showControllerDemoLink = group.slug === 'codex-agent-system';
      const article = this.articles.find((item) => item.slug === slug);
      if (!article) {
        void this.router.navigate(this.articleRoute(group.defaultArticleSlug), { replaceUrl: true });
        return;
      }
      this.article = article;
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  private renderInlineCode(text: string): string {
    return this.escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private resolveGroup(requestedSection: ArticleGroupSlug | null, fallback: ArticleGroupSlug): ArticleGroup {
    return (
      ARTICLE_GROUPS.find((group) => group.slug === requestedSection) ??
      ARTICLE_GROUPS.find((group) => group.slug === fallback) ??
      ARTICLE_GROUPS[0]
    );
  }

  private articlesForGroup(groupSlug: ArticleGroupSlug): ViewArticle[] {
    return this.allArticles.filter((article) => article.groupSlug === groupSlug);
  }

  private articleRoute(slug: string): string[] {
    return ['/', slug];
  }
}
