// Wrapper: 스크래퍼를 별도 패키지로 분리하여(Cloudflare 배포 빌드에서 스크래핑 의존성 제거)
// 실제 스크래핑 로직은 tools/mcst-scraper/updateFestivals.js 에 있습니다.

import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scraperDir = path.join(__dirname, '../tools/mcst-scraper');
const scraperEntry = path.join(scraperDir, 'updateFestivals.js');

const result = spawnSync(process.execPath, [scraperEntry], {
  cwd: scraperDir,
  stdio: 'inherit',
});

process.exit(typeof result.status === 'number' ? result.status : 1);
