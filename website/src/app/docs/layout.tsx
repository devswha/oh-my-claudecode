import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <div className="flex flex-col">
            <span>Oh My ClaudeCode</span>
            <span className="text-xs text-fd-muted-foreground">v4.8.2</span>
          </div>
        ),
        url: '/docs',
      }}
      sidebar={{
        defaultOpenLevel: 1,
      }}
      links={[
        {
          text: 'GitHub',
          url: 'https://github.com/Yeachan-Heo/oh-my-claudecode',
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
