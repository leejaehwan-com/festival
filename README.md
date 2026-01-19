# 대한민국 축제 일정 프로젝트

대한민국 국내 축제 및 행사 일정을 확인할 수 있는 React 기반 웹 애플리케이션입니다.

## 주요 기능

- 오늘 날짜부터 빠른 시일 내에 있는 축제들을 자동으로 필터링
- 시작일이 빠른 순으로 정렬
- 지역별 필터링 기능
- 반응형 디자인

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 기술 스택

- React 18
- Vite
- CSS3

## 데이터 출처 및 URL 변경 시 수정 위치

현재 축제 데이터는 문화체육관광부 **지역축제(목록보기)** 페이지를 기준으로 스크래핑합니다:

- `https://www.mcst.go.kr/site/s_culture/festival/festivalList.jsp?pMenuCD=&pCurrentPage=1&pSearchType=&pSearchWord=&pSeq=&pSido=&pOrder=&pPeriod=&fromDt=&toDt=`

만약 위 URL 구조가 변경되면, `scripts/updateFestivals.js` 상단의 아래 상수만 수정하면 됩니다:

- `MCST_BASE`
- `MCST_LIST_URL`
- `MCST_DETAIL_URL`
