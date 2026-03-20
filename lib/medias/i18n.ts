/**
 * Media i18n helper에서 기대하는 최소 필드 형태입니다.
 *
 * Prisma `Media` 전체 타입에 의존하지 않고,
 * 여러 쿼리(select 일부)에서 재사용할 수 있도록 좁은 타입으로 정의합니다.
 */
export type MediaI18nLike = {
  mediaName: string;
  description?: string | null;
  mediaNameKo?: string | null;
  mediaNameEn?: string | null;
  descriptionKo?: string | null;
  descriptionEn?: string | null;
};

/**
 * locale에 따라 매체명을 선택합니다.
 *
 * - locale === "ko" 인 경우:
 *   - mediaNameKo가 있으면 우선 사용
 *   - 없으면 기본 mediaName 사용
 * - 그 외(locale !== "ko")인 경우:
 *   - mediaNameEn이 있으면 우선 사용
 *   - 없으면 기본 mediaName 사용
 *
 * 공통적으로, 최종적으로는 항상 string을 반환하며,
 * null/undefined는 빈 문자열로 취급합니다.
 */
export function getLocalizedMediaTitle(
  media: MediaI18nLike,
  locale: string,
): string {
  const base = (media.mediaName ?? "").trim();

  if (locale === "ko") {
    const ko = (media.mediaNameKo ?? "").trim();
    return ko || base;
  }

  const en = (media.mediaNameEn ?? "").trim();
  return en || base;
}

/**
 * locale에 따라 매체 설명을 선택합니다.
 *
 * - locale === "ko" 인 경우:
 *   - descriptionKo가 있으면 우선 사용
 *   - 없으면 기본 description 사용
 * - 그 외(locale !== "ko")인 경우:
 *   - descriptionEn이 있으면 우선 사용
 *   - 없으면 기본 description 사용
 *
 * 반환값은 항상 string이며, null/undefined는 빈 문자열로 처리됩니다.
 * UI에서 line-clamp / whitespace-pre-wrap 등을 적용하기 쉽도록
 * 앞뒤 공백을 제거한 문자열을 반환합니다.
 */
export function getLocalizedMediaDescription(
  media: MediaI18nLike,
  locale: string,
): string {
  const base = (media.description ?? "").trim();

  if (locale === "ko") {
    const ko = (media.descriptionKo ?? "").trim();
    return ko || base;
  }

  const en = (media.descriptionEn ?? "").trim();
  return en || base;
}

