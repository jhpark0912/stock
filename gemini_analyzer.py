# -*- coding: utf-8 -*-
"""
gemini_analyzer.py
Gemini API를 활용한 주식 AI 분석 모듈

기능:
- 재무 지표 기반 투자 인사이트 제공
- 기술적 지표 분석
- 뉴스 감성 분석
- 종합 투자 의견 생성
"""

import os
import json
from typing import Dict, List, Optional

try:
    import google.generativeai as genai
    from dotenv import load_dotenv
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class GeminiAnalyzer:
    """Gemini API를 사용한 주식 분석 클래스"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Gemini Analyzer 초기화

        Args:
            api_key (str, optional): Gemini API 키. None이면 환경 변수에서 로드.
        """
        if not GEMINI_AVAILABLE:
            raise ImportError(
                "Gemini API를 사용하려면 다음 라이브러리를 설치하세요:\n"
                "pip install google-generativeai python-dotenv"
            )

        # 환경 변수 로드
        load_dotenv()

        # API 키 설정
        if api_key is None:
            api_key = os.getenv('GEMINI_API_KEY')

        if not api_key:
            raise ValueError(
                "Gemini API 키를 찾을 수 없습니다.\n"
                "다음 중 하나를 수행하세요:\n"
                "1. .env 파일에 GEMINI_API_KEY=your_api_key 추가\n"
                "2. 환경 변수 GEMINI_API_KEY 설정\n"
                "3. GeminiAnalyzer(api_key='your_api_key')로 직접 전달"
            )

        # Gemini 설정
        genai.configure(api_key=api_key)
        # gemini-flash-latest: 항상 최신 Flash 모델 사용 (자동 업데이트)
        # 또는 gemini-2.5-flash, gemini-2.0-flash 사용 가능
        self.model = genai.GenerativeModel('gemini-flash-latest')

    def analyze_stock(
        self,
        ticker: str,
        price_data: Dict,
        financial_data: Dict,
        technical_data: Optional[Dict] = None
    ) -> Dict:
        """
        주식 데이터를 분석하여 투자 인사이트 제공

        Args:
            ticker (str): 티커 심볼
            price_data (dict): 가격 정보 {'currentPrice', 'open', 'high', 'low', ...}
            financial_data (dict): 재무 지표 {'roe', 'pbr', 'per', ...}
            technical_data (dict, optional): 기술적 지표 {'rsi', 'macd', 'sma', ...}

        Returns:
            dict: AI 분석 결과
                {
                    'summary': '종합 평가',
                    'strengths': ['강점1', '강점2', ...],
                    'weaknesses': ['약점1', '약점2', ...],
                    'recommendation': '매수|보유|매도',
                    'risks': ['리스크1', '리스크2', ...],
                    'target_price': '목표가 (선택)'
                }
                또는 {'error': '에러 메시지'} (에러 시)
        """
        try:
            # 프롬프트 생성
            prompt = self._build_stock_analysis_prompt(
                ticker, price_data, financial_data, technical_data
            )

            # Gemini API 호출
            response = self.model.generate_content(prompt)

            # 응답 파싱
            result = self._parse_analysis_response(response.text)

            return result

        except Exception as e:
            return {'error': f"AI 분석 중 오류 발생: {str(e)}"}

    def analyze_news_sentiment(
        self,
        ticker: str,
        news_items: List[Dict]
    ) -> Dict:
        """
        뉴스 헤드라인의 감성 분석

        Args:
            ticker (str): 티커 심볼
            news_items (list): 뉴스 항목 리스트
                [{'title': '제목', 'link': 'URL', 'publishedAt': '날짜'}, ...]

        Returns:
            dict: 감성 분석 결과
                {
                    'score': -100~100 (감성 점수),
                    'sentiment': 'positive|neutral|negative',
                    'positive_news': ['긍정 뉴스 요약1', ...],
                    'negative_news': ['부정 뉴스 요약1', ...],
                    'market_mood': '시장 심리 평가'
                }
                또는 {'error': '에러 메시지'} (에러 시)
        """
        try:
            if not news_items:
                return {
                    'score': 0,
                    'sentiment': 'neutral',
                    'positive_news': [],
                    'negative_news': [],
                    'market_mood': '뉴스 데이터가 없습니다.'
                }

            # 프롬프트 생성
            prompt = self._build_sentiment_analysis_prompt(ticker, news_items)

            # Gemini API 호출
            response = self.model.generate_content(prompt)

            # 응답 파싱
            result = self._parse_sentiment_response(response.text)

            return result

        except Exception as e:
            return {'error': f"감성 분석 중 오류 발생: {str(e)}"}

    def _build_stock_analysis_prompt(
        self,
        ticker: str,
        price_data: Dict,
        financial_data: Dict,
        technical_data: Optional[Dict]
    ) -> str:
        """주식 분석용 프롬프트 생성 (prompt.md 기반)"""

        # prompt.md 파일 읽기
        prompt_file = os.path.join(os.path.dirname(__file__), 'prompt.md')
        try:
            with open(prompt_file, 'r', encoding='utf-8') as f:
                prompt_template = f.read()
        except FileNotFoundError:
            # prompt.md가 없으면 기본 프롬프트 사용
            return self._build_default_prompt(ticker, price_data, financial_data, technical_data)

        # 데이터 포맷팅 (JSON 형식으로 깔끔하게)
        price_str = json.dumps(price_data, indent=2, ensure_ascii=False)
        financial_str = json.dumps(financial_data, indent=2, ensure_ascii=False)

        # 기술적 지표 포맷팅
        if technical_data and 'error' not in technical_data:
            technical_str = json.dumps(technical_data, indent=2, ensure_ascii=False)
        else:
            technical_str = "기술적 지표가 제공되지 않았습니다."

        # 플레이스홀더 치환
        prompt = prompt_template.format(
            ticker=ticker,
            price_data=price_str,
            financial_data=financial_str,
            technical_data=technical_str
        )

        # 출력 형식 지시 추가 (파싱을 위해)
        output_format = """

### [Response Format]
다음 형식으로 답변하세요 (각 항목은 명확히 구분):

## 종합 평가
[1-3문장으로 전반적인 평가]

## 강점
- [강점 1]
- [강점 2]
- [강점 3]

## 약점
- [약점 1]
- [약점 2]

## 투자 의견
[매수|보유|매도] 중 하나를 선택하고 이유를 간략히 설명

## 리스크 요인
- [리스크 1]
- [리스크 2]
- [리스크 3]

## 목표가 (선택사항)
[목표가 및 근거, 없으면 생략]
"""
        prompt = prompt + output_format

        return prompt

    def _build_default_prompt(
        self,
        ticker: str,
        price_data: Dict,
        financial_data: Dict,
        technical_data: Optional[Dict]
    ) -> str:
        """기본 프롬프트 생성 (prompt.md가 없을 때 사용)"""

        # 재무 지표 포맷팅
        financial_str = "\n".join([
            f"- {key}: {value}" for key, value in financial_data.items()
            if value is not None and value != 'N/A'
        ])

        # 기술적 지표 포맷팅
        technical_str = ""
        if technical_data and 'error' not in technical_data:
            technical_str = "\n\n기술적 지표:\n"
            if 'rsi' in technical_data:
                technical_str += f"- RSI(14): {technical_data['rsi'].get('rsi14', 'N/A')}\n"
            if 'macd' in technical_data:
                macd = technical_data['macd']
                technical_str += f"- MACD: {macd.get('macd', 'N/A')}\n"
                technical_str += f"- Signal: {macd.get('signal', 'N/A')}\n"
            if 'sma' in technical_data:
                sma = technical_data['sma']
                technical_str += f"- SMA(20): {sma.get('sma20', 'N/A')}\n"
                technical_str += f"- SMA(50): {sma.get('sma50', 'N/A')}\n"
                if sma.get('sma200'):
                    technical_str += f"- SMA(200): {sma['sma200']}\n"

        prompt = f"""당신은 20년 경력의 전문 주식 애널리스트입니다. 다음 주식 데이터를 분석하여 투자 인사이트를 제공하세요.

티커: {ticker}
현재가: ${price_data.get('currentPrice', 'N/A')}
시가총액: ${price_data.get('marketCap', 'N/A')}

재무 지표:
{financial_str}
{technical_str}

다음 형식으로 답변하세요 (각 항목은 명확히 구분):

## 종합 평가
[1-3문장으로 전반적인 평가]

## 강점
- [강점 1]
- [강점 2]
- [강점 3]

## 약점
- [약점 1]
- [약점 2]

## 투자 의견
[매수|보유|매도] 중 하나를 선택하고 이유를 간략히 설명

## 리스크 요인
- [리스크 1]
- [리스크 2]
- [리스크 3]

## 목표가 (선택사항)
[목표가 및 근거, 없으면 생략]

**중요**: 한국어로 답변하세요. 단, 전문 용어(PER, PBR 등)는 영문 약어 사용 가능.
"""
        return prompt

    def _build_sentiment_analysis_prompt(
        self,
        ticker: str,
        news_items: List[Dict]
    ) -> str:
        """뉴스 감성 분석용 프롬프트 생성"""

        # 뉴스 헤드라인 포맷팅
        news_str = "\n".join([
            f"{i+1}. {item.get('title', '제목 없음')}"
            for i, item in enumerate(news_items[:15])  # 최대 15개
        ])

        prompt = f"""당신은 금융 뉴스 분석 전문가입니다. 다음은 {ticker} 주식에 관한 최근 뉴스 헤드라인입니다.

뉴스 헤드라인:
{news_str}

각 헤드라인의 감성을 분석하고 다음 형식으로 답변하세요:

## 감성 점수
[전체 감성 점수: -100 (매우 부정) ~ +100 (매우 긍정)]

## 긍정적 뉴스 요약
- [긍정 뉴스 1 요약]
- [긍정 뉴스 2 요약]

## 부정적 뉴스 요약
- [부정 뉴스 1 요약]
- [부정 뉴스 2 요약]

## 시장 심리 평가
[1-2문장으로 전반적인 시장 심리 평가]

**중요**: 한국어로 답변하세요.
"""
        return prompt

    def _parse_analysis_response(self, response_text: str) -> Dict:
        """AI 분석 응답을 파싱하여 구조화된 딕셔너리로 변환"""

        try:
            result = {
                'summary': '',
                'strengths': [],
                'weaknesses': [],
                'recommendation': '',
                'risks': [],
                'target_price': None
            }

            lines = response_text.strip().split('\n')
            current_section = None

            for line in lines:
                line = line.strip()

                # 섹션 헤더 감지
                if '종합 평가' in line or '## 종합 평가' in line:
                    current_section = 'summary'
                    continue
                elif '강점' in line or '## 강점' in line:
                    current_section = 'strengths'
                    continue
                elif '약점' in line or '## 약점' in line:
                    current_section = 'weaknesses'
                    continue
                elif '투자 의견' in line or '## 투자 의견' in line:
                    current_section = 'recommendation'
                    continue
                elif '리스크' in line or '## 리스크' in line:
                    current_section = 'risks'
                    continue
                elif '목표가' in line or '## 목표가' in line:
                    current_section = 'target_price'
                    continue

                # 내용 추출
                if not line or line.startswith('#'):
                    continue

                if current_section == 'summary':
                    result['summary'] += line + ' '
                elif current_section in ['strengths', 'weaknesses', 'risks']:
                    if line.startswith('-') or line.startswith('•'):
                        result[current_section].append(line.lstrip('-•').strip())
                elif current_section == 'recommendation':
                    result['recommendation'] += line + ' '
                elif current_section == 'target_price':
                    result['target_price'] = line

            # 정리
            result['summary'] = result['summary'].strip()
            result['recommendation'] = result['recommendation'].strip()

            return result

        except Exception as e:
            # 파싱 실패 시 원문 반환
            return {
                'summary': response_text[:500],
                'strengths': [],
                'weaknesses': [],
                'recommendation': '분석 실패',
                'risks': [],
                'target_price': None,
                'raw_response': response_text
            }

    def _parse_sentiment_response(self, response_text: str) -> Dict:
        """감성 분석 응답을 파싱하여 구조화된 딕셔너리로 변환"""

        try:
            result = {
                'score': 0,
                'sentiment': 'neutral',
                'positive_news': [],
                'negative_news': [],
                'market_mood': ''
            }

            lines = response_text.strip().split('\n')
            current_section = None

            for line in lines:
                line = line.strip()

                # 섹션 헤더 감지
                if '감성 점수' in line or '## 감성 점수' in line:
                    current_section = 'score'
                    continue
                elif '긍정적 뉴스' in line or '## 긍정적 뉴스' in line:
                    current_section = 'positive'
                    continue
                elif '부정적 뉴스' in line or '## 부정적 뉴스' in line:
                    current_section = 'negative'
                    continue
                elif '시장 심리' in line or '## 시장 심리' in line:
                    current_section = 'mood'
                    continue

                # 내용 추출
                if not line or line.startswith('#'):
                    continue

                if current_section == 'score':
                    # 점수 추출 (숫자 찾기)
                    import re
                    numbers = re.findall(r'-?\d+', line)
                    if numbers:
                        score = int(numbers[0])
                        result['score'] = max(-100, min(100, score))  # -100~100 범위로 제한

                        # 감성 분류
                        if result['score'] > 30:
                            result['sentiment'] = 'positive'
                        elif result['score'] < -30:
                            result['sentiment'] = 'negative'
                        else:
                            result['sentiment'] = 'neutral'

                elif current_section == 'positive':
                    if line.startswith('-') or line.startswith('•'):
                        result['positive_news'].append(line.lstrip('-•').strip())
                elif current_section == 'negative':
                    if line.startswith('-') or line.startswith('•'):
                        result['negative_news'].append(line.lstrip('-•').strip())
                elif current_section == 'mood':
                    result['market_mood'] += line + ' '

            result['market_mood'] = result['market_mood'].strip()

            return result

        except Exception as e:
            # 파싱 실패 시 기본값 반환
            return {
                'score': 0,
                'sentiment': 'neutral',
                'positive_news': [],
                'negative_news': [],
                'market_mood': response_text[:200],
                'raw_response': response_text
            }


# 사용 예시 (테스트용)
if __name__ == "__main__":
    print("=== Gemini Analyzer 테스트 ===\n")

    # API 키 확인
    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        print("⚠️  GEMINI_API_KEY가 설정되지 않았습니다.")
        print("\n.env 파일에 다음과 같이 추가하세요:")
        print("GEMINI_API_KEY=your_api_key_here")
        exit(1)

    try:
        analyzer = GeminiAnalyzer()

        # 샘플 데이터
        sample_price = {
            'currentPrice': 150.25,
            'marketCap': 2400000000000
        }

        sample_financial = {
            'trailingPE': 28.5,
            'pbr': 8.2,
            'roe': 0.32,
            'debtToEquity': 45.2
        }

        sample_technical = {
            'rsi': {'rsi14': 62.5},
            'macd': {'macd': 1.2, 'signal': 0.8},
            'sma': {'sma20': 148.5, 'sma50': 145.0}
        }

        print("1. 주식 분석 테스트...")
        analysis = analyzer.analyze_stock(
            ticker="AAPL",
            price_data=sample_price,
            financial_data=sample_financial,
            technical_data=sample_technical
        )

        if 'error' not in analysis:
            print("\n[종합 평가]")
            print(analysis['summary'])
            print("\n[강점]")
            for s in analysis['strengths']:
                print(f"  - {s}")
            print("\n[투자 의견]")
            print(analysis['recommendation'])
        else:
            print(f"오류: {analysis['error']}")

        print("\n\n2. 뉴스 감성 분석 테스트...")
        sample_news = [
            {'title': 'Apple의 새로운 AI 기능 발표, 주가 급등'},
            {'title': 'iPhone 판매량 저조, 우려 확산'},
            {'title': 'Apple, 인도 시장에서 점유율 확대'}
        ]

        sentiment = analyzer.analyze_news_sentiment("AAPL", sample_news)

        if 'error' not in sentiment:
            print(f"\n[감성 점수] {sentiment['score']}")
            print(f"[감성] {sentiment['sentiment']}")
            print(f"[시장 심리] {sentiment['market_mood']}")
        else:
            print(f"오류: {sentiment['error']}")

    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")
