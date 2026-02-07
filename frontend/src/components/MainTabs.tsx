/**
 * Step 9: MainTabs
 * 4개 메인 탭 시스템 (Overview, AI, Technical, News)
 */

import { useState } from 'react';
import { BarChart3, Sparkles, LineChart, TrendingUp, Newspaper } from 'lucide-react';

interface MainTabsProps {
  children: (activeTab: string) => React.ReactNode;
}

type TabId = 'overview' | 'ai' | 'chart' | 'technical' | 'news';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'ai', label: 'AI Analysis', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'chart', label: 'Chart', icon: <LineChart className="h-4 w-4" /> },
  { id: 'technical', label: 'Technical', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'news', label: 'News', icon: <Newspaper className="h-4 w-4" /> },
];

export function MainTabs({ children }: MainTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="flex flex-col">
      {/* 탭 버튼 */}
      <div className="border-b border-border bg-card">
        <div className="flex gap-1 px-6 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-background text-foreground border-t border-l border-r border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {children(activeTab)}
      </div>
    </div>
  );
}
