/**
 * StealthPortfolioPage - 종목 조회 위장 페이지 (오케스트레이터)
 * 프로젝트 관리 노트 형태로 포트폴리오/주식 데이터를 표시
 */

import { useState } from 'react';
import { Plus, X, ChevronRight, ChevronLeft, Menu } from 'lucide-react';
import { usePortfolio } from '@/hooks/portfolio/usePortfolio';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { NoteSection, ProjectInfoLine } from '@/components/stealth/StealthPortfolioComponents';
import { StealthAnalysisSection } from '@/components/stealth/StealthAnalysisSection';
import type { NewsItem } from '@/types/stock';

export function StealthPortfolioPage() {
  const {
    stockData,
    newsData,
    aiAnalysis,
    aiError,
    loadingStates,
    userSettings,
    handleAddTicker,
    handleRemoveTicker,
    handleSelectTicker,
    handleAnalyzeAI,
    displayData,
    sidebarTickers,
  } = usePortfolio();

  const [newProjectInput, setNewProjectInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAdd = () => {
    const symbol = newProjectInput.trim().toUpperCase();
    if (symbol) {
      handleAddTicker(symbol);
      setNewProjectInput('');
      setIsAdding(false);
    }
  };

  const handleSelect = (symbol: string) => {
    handleSelectTicker(symbol);
    setSidebarOpen(false);
  };

  const selectedTicker = userSettings.selectedTicker || sidebarTickers[0]?.symbol || null;

  return (
    <div className="h-full min-h-0 flex bg-background relative">
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 좌측: 프로젝트 목록 */}
      <div
        className={`
          absolute inset-y-0 left-0 z-20 w-56 border-r border-border flex flex-col bg-card
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">프로젝트 목록</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto py-1">
          {sidebarTickers.map((ticker) => (
            <button
              key={ticker.symbol}
              onClick={() => handleSelect(ticker.symbol)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors group ${
                selectedTicker === ticker.symbol
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedTicker === ticker.symbol && <ChevronRight className="h-3 w-3" />}
                <span>{ticker.symbol}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTicker(ticker.symbol);
                }}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 sm:p-0.5 hover:bg-muted rounded"
                title="삭제"
              >
                <X className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
              </button>
            </button>
          ))}
        </div>

        <div className="border-t border-border p-1.5">
          {isAdding ? (
            <div className="space-y-1">
              <input
                type="text"
                value={newProjectInput}
                onChange={(e) => setNewProjectInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="코드 입력 (예: AAPL)"
                className="w-full px-2.5 py-1 text-[10px] border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAdd}
                  className="flex-1 px-2.5 py-1 bg-muted text-foreground rounded-md text-[10px] font-medium hover:bg-muted/80 transition-opacity"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewProjectInput('');
                  }}
                  className="flex-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-[10px] font-medium hover:opacity-90 transition-opacity"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-start gap-1 px-2.5 py-1 border-2 border-dashed border-border rounded-md text-[10px] font-medium text-muted-foreground hover:bg-muted hover:border-muted-foreground hover:text-foreground transition-all"
            >
              <Plus className="h-2.5 w-2.5" />
              추가
            </button>
          )}
        </div>
      </div>

      {/* 우측: 프로젝트 상세 */}
      <div className="flex-1 overflow-auto min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            title="프로젝트 목록"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {selectedTicker ? `프로젝트 ${selectedTicker}` : '프로젝트 선택'}
          </span>
        </div>

        {loadingStates.stock && (
          <div className="p-6">
            <LoadingSpinner message="불러오는 중..." />
          </div>
        )}

        {!stockData && !loadingStates.stock && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {sidebarTickers.length === 0
                  ? '프로젝트를 추가하세요.'
                  : '목록에서 프로젝트를 선택하세요.'}
              </p>
            </div>
          </div>
        )}

        {stockData && (
          <div className="p-6 space-y-6 max-w-2xl">
            <div className="border-b border-border pb-4">
              <h1 className="text-lg font-medium text-foreground">
                프로젝트 {stockData.ticker} 현황 보고
              </h1>
              <div className="mt-2 space-y-1 text-sm">
                <ProjectInfoLine label="부서" value={stockData.company.sector || 'N/A'} />
                <ProjectInfoLine label="분야" value={stockData.company.industry || 'N/A'} />
              </div>
            </div>

            <NoteSection title="프로젝트 현황">
              <div className="space-y-1">
                <ProjectInfoLine
                  label="현재"
                  value={`$${stockData.price.current.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                />
                {displayData.purchasePrice !== null && (
                  <ProjectInfoLine
                    label="기준"
                    value={`$${displayData.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  />
                )}
                {displayData.quantity !== null && (
                  <ProjectInfoLine label="투입" value={`${displayData.quantity}건`} />
                )}
                {displayData.purchasePrice !== null && stockData.price.current && (
                  <ProjectInfoLine
                    label="성과"
                    value={`${(((stockData.price.current - displayData.purchasePrice) / displayData.purchasePrice) * 100).toFixed(1)}%`}
                  />
                )}
              </div>
            </NoteSection>

            <NoteSection title="세부 지표">
              <div className="space-y-1">
                {stockData.financials.trailing_pe !== null && (
                  <ProjectInfoLine
                    label="PER"
                    value={stockData.financials.trailing_pe.toFixed(1)}
                  />
                )}
                {stockData.financials.pbr !== null && (
                  <ProjectInfoLine label="PBR" value={stockData.financials.pbr.toFixed(2)} />
                )}
                {stockData.financials.roe !== null && (
                  <ProjectInfoLine
                    label="ROE"
                    value={`${(stockData.financials.roe * 100).toFixed(1)}%`}
                  />
                )}
                {stockData.financials.opm !== null && (
                  <ProjectInfoLine
                    label="영업이익률"
                    value={`${(stockData.financials.opm * 100).toFixed(1)}%`}
                  />
                )}
                {stockData.financials.dividend_yield !== null && (
                  <ProjectInfoLine
                    label="배당률"
                    value={`${(stockData.financials.dividend_yield * 100).toFixed(2)}%`}
                  />
                )}
                {stockData.financials.revenue_growth !== null && (
                  <ProjectInfoLine
                    label="매출성장률"
                    value={`${(stockData.financials.revenue_growth * 100).toFixed(1)}%`}
                  />
                )}
                {stockData.financials.debt_to_equity !== null && (
                  <ProjectInfoLine
                    label="부채비율"
                    value={`${stockData.financials.debt_to_equity.toFixed(1)}%`}
                  />
                )}
                {stockData.market_cap !== null && (
                  <ProjectInfoLine
                    label="규모"
                    value={`$${(stockData.market_cap / 1e9).toFixed(2)}B`}
                  />
                )}
              </div>
            </NoteSection>

            <StealthAnalysisSection
              stockData={stockData}
              aiAnalysis={aiAnalysis}
              aiError={aiError}
              loadingAI={loadingStates.ai}
              onAnalyzeAI={handleAnalyzeAI}
            />

            {newsData && newsData.length > 0 && (
              <NoteSection title="관련 보고서">
                <div className="space-y-2">
                  {newsData.slice(0, 5).map((news: NewsItem, index: number) => (
                    <a
                      key={index}
                      href={news.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm hover:underline"
                    >
                      <span className="text-muted-foreground mr-2">-</span>
                      <span className="text-foreground">{news.title}</span>
                      {news.source && (
                        <span className="text-muted-foreground text-xs ml-2">({news.source})</span>
                      )}
                    </a>
                  ))}
                </div>
              </NoteSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
