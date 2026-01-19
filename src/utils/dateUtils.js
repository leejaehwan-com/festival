// 날짜 유틸리티 함수들

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 날짜 문자열을 Date 객체로 변환
 */
export const parseDate = (dateString) => {
  return new Date(dateString);
};

/**
 * 날짜만 비교하기 위해 시간을 00:00:00으로 맞춘 Date 반환
 */
export const toDateOnly = (dateString) => {
  const d = parseDate(dateString);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * 종료일 기준으로 진행중/예정 축제인지 확인 (오늘 포함)
 */
export const isActiveOrUpcoming = (endDate) => {
  const today = toDateOnly(getToday());
  const end = toDateOnly(endDate);
  return end >= today;
};

/**
 * 현재 진행중인지 확인 (오늘 포함)
 */
export const isOngoing = (startDate, endDate) => {
  const today = toDateOnly(getToday());
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  return start <= today && today <= end;
};

/**
 * 시작일까지 남은 날짜 (일 단위)
 * - 오늘 시작: 0
 * - 이미 시작: 음수
 */
export const getDaysUntil = (dateString) => {
  const today = toDateOnly(getToday());
  const targetDate = toDateOnly(dateString);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
 */
export const formatDate = (dateString) => {
  const date = parseDate(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};
