import { formatDate, getDaysUntil, isOngoing } from '../utils/dateUtils';
import './FestivalCard.css';

const FestivalCard = ({ festival }) => {
  const daysUntil = getDaysUntil(festival.startDate);
  const ongoing = isOngoing(festival.startDate, festival.endDate);
  const isTodayStart = daysUntil === 0;
  const isTomorrowStart = daysUntil === 1;

  const timeText = festival.periodText?.includes('|')
    ? festival.periodText.split('|')[1].trim()
    : '';

  const getDaysText = () => {
    if (ongoing) return '진행중';
    if (isTodayStart) return '오늘 시작!';
    if (isTomorrowStart) return '내일 시작';
    return `${daysUntil}일 후 시작`;
  };

  const formatFeeText = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return '';

    // 무료인 경우: "무료"만 표시
    if (text.includes('무료') && !text.includes('유료')) return '무료';

    // 유료 접두어 제거
    let cleaned = text;
    cleaned = cleaned.replace(/^입장료\s*유료\s*[-:]\s*/g, '');
    cleaned = cleaned.replace(/^유료\s*\|\s*/g, '');
    cleaned = cleaned.replace(/^유료\s*/g, '');

    // 구분자(|)는 줄바꿈으로
    const lines = cleaned
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    return lines.join('\n');
  };

  return (
    <div className="festival-card">
      <div className="festival-card-header">
        <div className="header-left">
          <span className={`days-badge compact ${ongoing ? 'ongoing' : isTodayStart ? 'today' : ''}`}>
            {getDaysText()}
          </span>
          <h3 className="festival-name">{festival.name}</h3>
        </div>
      </div>
      <div className="festival-info">
        <div className="festival-main">
          <div className="festival-meta">
            <div className="festival-location">
              <span className="location-icon">📍</span>
              <div className="location-details">
                <span className="location-city">{festival.location}</span>
                {festival.address && (
                  <span className="location-address">{festival.address}</span>
                )}
              </div>
            </div>
            <div className="festival-dates">
              <span className="date-icon">📅</span>
              <div className="date-details">
                <span className="date-range">
                  {formatDate(festival.startDate)} ~ {formatDate(festival.endDate)}
                </span>
                {timeText && <span className="date-time">{timeText}</span>}
              </div>
            </div>
            {festival.feeText && (
              <div className="festival-fee">
                <span className="fee-icon">💳</span>
                <div className="fee-details">
                  <span className="fee-label">요금</span>
                  <div className="fee-text">{formatFeeText(festival.feeText)}</div>
                </div>
              </div>
            )}
          </div>

          {festival.imageUrl && (
            <div className="festival-media" aria-hidden="true">
              <img src={festival.imageUrl} alt="" loading="lazy" />
            </div>
          )}
        </div>
        <p className="festival-description">{festival.description}</p>
        {festival.homepageUrl ? (
          <a
            href={festival.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="festival-link"
          >
            <span className="link-icon">🔗</span>
            축제 홈페이지 방문하기
          </a>
        ) : (
          <button className="festival-link disabled" type="button" disabled>
            <span className="link-icon">🔗</span>
            관련 누리집 없음
          </button>
        )}
      </div>
    </div>
  );
};

export default FestivalCard;
