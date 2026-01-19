import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { load } from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 데이터 출처(참고 페이지)
 * - https://www.mcst.go.kr/site/s_culture/festival/festivalList.jsp
 *
 * URL 구조가 바뀌면 아래 상수만 수정하면 됩니다.
 */
const MCST_BASE = 'https://www.mcst.go.kr';
const MCST_LIST_URL = (pageNo) =>
  `${MCST_BASE}/site/s_culture/festival/festivalList.jsp?pMenuCD=&pCurrentPage=${pageNo}&pSearchType=&pSearchWord=&pSeq=&pSido=&pOrder=&pPeriod=&fromDt=&toDt=`;
const MCST_DETAIL_URL = (href) =>
  href.startsWith('http') ? href : `${MCST_BASE}/site/s_culture/festival/${href.replace(/^\//, '')}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const toIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parsePeriodToIso = (periodText) => {
  // 예: "2026. 1. 9. ~ 1. 25. | 10:00~17:00"
  // 예: "2025. 12. 19. ~ 2026. 2. 1. | 17:00~23:00"
  const m = periodText.match(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*~\s*(?:(\d{4})\.\s*)?(\d{1,2})\.\s*(\d{1,2})\./,
  );
  if (!m) return null;
  const sy = parseInt(m[1], 10);
  const sm = parseInt(m[2], 10) - 1;
  const sd = parseInt(m[3], 10);
  const ey = m[4] ? parseInt(m[4], 10) : sy;
  const em = parseInt(m[5], 10) - 1;
  const ed = parseInt(m[6], 10);
  const start = new Date(sy, sm, sd);
  const end = new Date(ey, em, ed);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end), raw: periodText.trim() };
};

const extractLocation = (address) => {
  if (!address) return '기타';
  const patterns = [
    /서울/g, /부산/g, /대구/g, /인천/g, /광주/g, /대전/g, /울산/g,
    /세종/g, /경기/g, /강원/g, /충북/g, /충남/g, /전북/g, /전남/g, /경북/g, /경남/g, /제주/g,
  ];
  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) {
      const location = match[0];
      if (['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '제주'].includes(location)) {
        return location;
      }
      const cityMatch = address.match(/(\S+시|\S+군|\S+구)/);
      if (cityMatch) return cityMatch[0].replace(/시|군|구/g, '').trim();
    }
  }
  const cityMatch = address.match(/(\S+시|\S+군|\S+구)/);
  if (cityMatch) return cityMatch[0].replace(/시|군|구/g, '').trim();
  return '기타';
};

// 개최지역/주소에서 "시·도(첫 토큰)"만 추출 (예: "경기도 양평군 ..." -> "경기도", "부산시 동래구" -> "부산시")
const extractSidoToken = (text) => {
  const t = String(text || '').trim();
  if (!t) return '기타';
  const first = t.split(/\s+/)[0]?.trim();
  return first || '기타';
};

const escapeJsString = (value) => {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/'/g, "\\'");
};

async function fetchFestivalListWithPuppeteer() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    await page.goto(MCST_LIST_URL(1), { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1200);

    const totalPages = await page.evaluate(() => {
      const whole = document.querySelector('.whole-count')?.textContent || '';
      const m = whole.match(/\[(\d+)\s*\/\s*(\d+)\s*쪽\]/);
      if (m) return parseInt(m[2], 10);

      const nums = Array.from(document.querySelectorAll('a.page-link'))
        .map((a) => parseInt((a.textContent || '').trim(), 10))
        .filter((n) => Number.isFinite(n));
      return nums.length ? Math.max(...nums) : 1;
    });

    console.log(`📚 총 페이지: ${totalPages}쪽`);

    const list = [];

    for (let p = 1; p <= totalPages; p++) {
      if (p !== 1) {
        await page.goto(MCST_LIST_URL(p), { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(1200);
      }

      console.log(`📄 ${p}페이지 수집 중...`);

      const pageItems = await page.evaluate(() => {
        const items = [];
        const lis = document.querySelectorAll('ul.thum-list > li');
        lis.forEach((li) => {
          const a = li.querySelector('a.go');
          if (!a) return;

          const name = li.querySelector('.text.festival .sub-tit')?.textContent?.trim() || '';
          const periodText =
            Array.from(li.querySelectorAll('.text.festival .list li')).find((x) =>
              (x.textContent || '').includes('기간'),
            )?.textContent || '';
          const placeText =
            Array.from(li.querySelectorAll('.text.festival .list li')).find((x) =>
              (x.textContent || '').includes('장소'),
            )?.textContent || '';
          const href = a.getAttribute('href') || '';

          items.push({
            name,
            periodText,
            placeText,
            href,
          });
        });
        return items;
      });

      console.log(`✅ ${pageItems.length}개 축제 수집 완료`);
      list.push(...pageItems);
      await sleep(600);
    }

    return list;
  } finally {
    await browser.close();
  }
}

async function fetchFestivalDetail(detailUrl) {
  const res = await fetch(detailUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`detail fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = load(html);

  const getDdByDt = (dtText) => {
    const dt = $('dl.board dt').filter((_, el) => $(el).text().trim() === dtText).first();
    if (!dt.length) return '';
    return dt.next('dd').text().trim();
  };

  const festivalName = $('h3.view_title').first().text().trim();
  const region = getDdByDt('개최지역'); // 예: 경상북도 영양군
  const period = getDdByDt('개최기간'); // 예: 2026. 1. 9. ~ 1. 25. | ...
  const place = getDdByDt('축제장소'); // 예: 영양읍 현리 빙상장일원
  const feeText = getDdByDt('요금'); // 예: 유료/무료/...

  // 상세페이지 대표 이미지 (목록 썸네일과 동일/유사)
  const imgSrcRaw =
    $('.culture_view.festival img').first().attr('src') ||
    $('.culture_view img').first().attr('src') ||
    '';
  const imageUrl = imgSrcRaw
    ? (imgSrcRaw.startsWith('http') ? imgSrcRaw : `${MCST_BASE}${imgSrcRaw}`)
    : '';

  const getFirstLinkByDt = (dtText) => {
    const dt = $('dl.board dt').filter((_, el) => $(el).text().trim() === dtText).first();
    if (!dt.length) return '';
    const href = dt.next('dd').find('a[href]').first().attr('href') || '';
    return href.trim();
  };

  // MCST 상세페이지는 '관련 누리집'에 외부 링크가 들어가는 경우가 많음
  const relatedHref = getFirstLinkByDt('관련 누리집');
  const homepageHref = getFirstLinkByDt('홈페이지');
  const rawLink = relatedHref || homepageHref;

  const homepageUrl = rawLink
    ? (rawLink.startsWith('http') ? rawLink : `https://${rawLink.replace(/^\/+/, '')}`)
    : '';

  const description = $('.view_con').first().text().trim();

  const parsed = parsePeriodToIso(period);

  const address = [region, place].filter(Boolean).join(' ');
  const sido = extractSidoToken(region || address || place);
  const location = sido;

  return {
    name: festivalName || '',
    location,
    address,
    startDate: parsed?.startDate || '',
    endDate: parsed?.endDate || '',
    periodText: parsed?.raw || period || '',
    description,
    mcstUrl: detailUrl,
    homepageUrl,
    imageUrl,
    feeText,
  };
}

function formatFestivalsFile(festivals) {
  const festivalsArray = festivals
    .map((festival, idx) => ({ ...festival, id: idx + 1 }))
    .map((festival) => {
      return `  {
    id: ${festival.id},
    name: '${escapeJsString(festival.name)}',
    location: '${escapeJsString(festival.location)}',
    address: '${escapeJsString(festival.address)}',
    startDate: '${escapeJsString(festival.startDate)}',
    endDate: '${escapeJsString(festival.endDate)}',
    periodText: '${escapeJsString(festival.periodText)}',
    description: '${escapeJsString(String(festival.description || '').substring(0, 800))}',
    mcstUrl: '${escapeJsString(festival.mcstUrl)}',
    homepageUrl: '${escapeJsString(festival.homepageUrl)}',
    imageUrl: '${escapeJsString(festival.imageUrl)}',
    feeText: '${escapeJsString(festival.feeText)}',
  }`;
    })
    .join(',\n');

  return `// 문화체육관광부 지역축제(목록보기) 기반 데이터
// - 참고 페이지: ${MCST_LIST_URL(1)}
// - 이 파일은 scripts/updateFestivals.js 에 의해 자동 생성됩니다.

export const festivals = [
${festivalsArray}
];

export const getRegions = () => {
  const regions = [...new Set(festivals.map(festival => festival.location))];
  return regions.sort();
};
`;
}

async function updateFestivals() {
  console.log('🔄 축제 데이터 업데이트 시작...');
  console.log(`📅 실행 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`📌 목록 URL: ${MCST_LIST_URL(1)}`);

  const listItems = await fetchFestivalListWithPuppeteer();
  const unique = [];
  const seen = new Set();
  for (const item of listItems) {
    const key = `${item.name}|${item.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  // 상세 페이지에서 '홈페이지' 링크/정확한 기간/장소를 가져온다
  const results = [];
  for (const item of unique) {
    const detailUrl = MCST_DETAIL_URL(item.href);
    try {
      const detail = await fetchFestivalDetail(detailUrl);
      // 기간/날짜가 없는 항목은 제외 (표시/정렬 불가)
      if (!detail.startDate || !detail.endDate) continue;
      results.push(detail);
    } catch (e) {
      console.log(`⚠️  상세 파싱 실패: ${item.name} (${detailUrl})`);
    }
    await sleep(250);
  }

  // 종료일 기준: 오늘 이전에 끝난 축제는 제외 (진행중/예정만)
  const todayIso = toIsoDate(new Date());
  const filtered = results.filter((f) => f.endDate >= todayIso);

  // 정렬: (진행중/예정) 시작일 오름차순
  filtered.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

  console.log(`✅ ${filtered.length}개의 축제(진행중/예정)를 수집했습니다.`);

  const festivalsFilePath = path.join(__dirname, '../src/data/festivals.js');
  fs.writeFileSync(festivalsFilePath, formatFestivalsFile(filtered), 'utf-8');

  console.log('✅ 축제 데이터 업데이트 완료!');
  console.log(`📝 파일 경로: ${festivalsFilePath}`);
}

updateFestivals().catch((e) => {
  console.error('❌ 축제 데이터 업데이트 실패:', e);
  process.exit(1);
});
