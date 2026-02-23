/**
 * StealthPortfolioPage - 종목 조회 위장 페이지
 * 프로젝트 관리 노트 형태로 포트폴리오/주식 데이터를 표시
 * 차트/기술적 지표 완전 숨김, 모노톤 색상
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Menu,
  RefreshCw,
  FileText,
  History,
  Save,
  Trash2,
} from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  generateSummary,
  saveAnalysis,
  getAnalysisHistory,
  deleteAnalysis,
} from '@/lib/analysisApi';
import type {
  StockData,
  AIAnalysis,
  NewsItem,
  AnalysisSummary,
  SavedAnalysis,
  InvestmentStrategy,
} from '@/types/stock';

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
    setSidebarOpen(false); // 모바일에서 선택 후 자동 닫기
  };

  const selectedTicker = userSettings.selectedTicker || sidebarTickers[0]?.symbol || null;

  return (
    <div className="h-full min-h-0 flex bg-background relative">
      {/* 모바일 오버레이 배경 */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 좌측: 프로젝트 목록 (데스크탑: 항상 표시, 모바일: 슬라이드) */}
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

        {/* 프로젝트 추가 */}
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

      {/* 우측: 프로젝트 상세 (메인 콘텐츠 대체) */}
      <div className="flex-1 overflow-auto min-w-0">
        {/* 모바일 헤더: 사이드바 열기 버튼 */}
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
            {/* 프로젝트 제목 */}
            <div className="border-b border-border pb-4">
              <h1 className="text-lg font-medium text-foreground">
                프로젝트 {stockData.ticker} 현황 보고
              </h1>
              <div className="mt-2 space-y-1 text-sm">
                <ProjectInfoLine label="부서" value={stockData.company.sector || 'N/A'} />
                <ProjectInfoLine label="분야" value={stockData.company.industry || 'N/A'} />
              </div>
            </div>

            {/* 주요 지표 → 프로젝트 지표 */}
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

            {/* 재무 지표 → 세부 지표 */}
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

            {/* AI 분석 → 분석 보고서 */}
            <StealthAnalysisSection
              stockData={stockData}
              aiAnalysis={aiAnalysis}
              aiError={aiError}
              loadingAI={loadingStates.ai}
              onAnalyzeAI={handleAnalyzeAI}
            />

            {/* 뉴스 → 관련 보고서 */}
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

/** 노트 섹션 */
function NoteSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">{title}</h2>
      <div className="pl-3">{children}</div>
    </div>
  );
}

/** 프로젝트 정보 라인 */
function ProjectInfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-muted-foreground">-</span>
      <span className="text-muted-foreground min-w-[5rem]">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

/** 투자 전략을 업무 용어로 변환 */
function strategyToLabel(strategy: string): string {
  const s = strategy.toLowerCase() as InvestmentStrategy;
  const map: Record<InvestmentStrategy, string> = {
    buy: '확대',
    hold: '유지',
    sell: '축소',
  };
  return map[s] || strategy;
}

/** 스텔스 모드 분석 보고서 섹션 (요약/저장/이력 포함) */
function StealthAnalysisSection({
  stockData,
  aiAnalysis,
  aiError,
  loadingAI,
  onAnalyzeAI,
}: {
  stockData: StockData;
  aiAnalysis: AIAnalysis | null;
  aiError: { type: string; message: string } | null;
  loadingAI: boolean;
  onAnalyzeAI: () => void;
}) {
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // AI 분석이 변경되면 요약 상태 초기화
  useEffect(() => {
    setSummary(null);
    setSaveSuccess(false);
    setSummaryError(null);
  }, [aiAnalysis]);

  const handleGenerateSummary = async () => {
    if (!aiAnalysis) return;
    setSummaryLoading(true);
    setSummaryError(null);
    setSaveSuccess(false);
    try {
      const result = await generateSummary(stockData.ticker, aiAnalysis.report);
      setSummary(result);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '요약 생성 실패');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!summary) return;
    setSaveLoading(true);
    try {
      await saveAnalysis(stockData.ticker, {
        summary: summary.summary,
        strategy: summary.strategy,
        current_price: stockData.price.current,
        full_report: aiAnalysis?.report,
      });
      setSaveSuccess(true);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAnalyzeWithReset = () => {
    setSummary(null);
    setSaveSuccess(false);
    setSummaryError(null);
    onAnalyzeAI();
  };

  return (
    <>
      <NoteSection title="분석 보고서">
        <div className="space-y-3">
          {/* 보고서 내용 */}
          {aiAnalysis ? (
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {aiAnalysis.report}
            </div>
          ) : aiError ? (
            <p className="text-sm text-muted-foreground">{aiError.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">분석 보고서가 없습니다.</p>
          )}

          {/* 요약 섹션 */}
          {aiAnalysis && (
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">요약</span>
                {!summary && !summaryLoading && (
                  <button
                    onClick={handleGenerateSummary}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-3 w-3" />
                    요약 생성
                  </button>
                )}
              </div>

              {summaryLoading && <p className="text-xs text-muted-foreground">요약 생성 중...</p>}

              {summaryError && <p className="text-xs text-muted-foreground">{summaryError}</p>}

              {summary && (
                <div className="space-y-2">
                  {summary.summary.split('\n').map((line, idx) => (
                    <p key={idx} className="text-sm text-foreground">
                      - {line}
                    </p>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      방향: {strategyToLabel(summary.strategy)}
                    </span>
                    <button
                      onClick={handleSaveAnalysis}
                      disabled={saveLoading || saveSuccess}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {saveLoading ? '저장 중...' : saveSuccess ? '저장 완료' : '저장'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={aiAnalysis ? handleAnalyzeWithReset : onAnalyzeAI}
              disabled={loadingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {loadingAI ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              {loadingAI ? '분석 중...' : aiAnalysis ? '재분석' : 'AI 분석 요청'}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors ${
                showHistory
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="h-3 w-3" />
              이력
            </button>
          </div>
        </div>
      </NoteSection>

      {/* 이력 패널 (인라인) */}
      {showHistory && (
        <StealthAnalysisHistory ticker={stockData.ticker} onClose={() => setShowHistory(false)} />
      )}
    </>
  );
}

/** 스텔스 모드 분석 이력 (인라인 패널, 모달 아님) */
function StealthAnalysisHistory({ ticker, onClose }: { ticker: string; onClose: () => void }) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, [ticker]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalysisHistory(ticker);
      setAnalyses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이력 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <NoteSection title="분석 이력">
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="text-xs text-muted-foreground">{error}</p>
        ) : analyses.length === 0 ? (
          <p className="text-xs text-muted-foreground">저장된 이력이 없습니다.</p>
        ) : (
          analyses.map((analysis) => (
            <div key={analysis.id} className="border border-border rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(analysis.created_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' / '}
                  {strategyToLabel(analysis.strategy)}
                </span>
                <button
                  onClick={() => handleDelete(analysis.id)}
                  disabled={deletingId === analysis.id}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {analysis.summary.split('\n').map((line, idx) => (
                <p key={idx} className="text-sm text-foreground">
                  - {line}
                </p>
              ))}
              {analysis.current_price && (
                <p className="text-xs text-muted-foreground pt-1">
                  기록 시점: ${analysis.current_price.toFixed(2)}
                </p>
              )}
            </div>
          ))
        )}
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          닫기
        </button>
      </div>
    </NoteSection>
  );
}
