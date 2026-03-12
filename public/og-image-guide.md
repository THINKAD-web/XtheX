# OG Image & 아이콘 가이드

## og-image.png (Open Graph / SNS 공유 이미지)

- **경로**: `public/og-image.png`
- **권장 크기**: **1200 × 630 px** (Facebook, LinkedIn, Twitter 등 공통 권장 비율)
- **용량**: 1MB 이하 권장
- **내용**: 로고 + 슬로건 또는 메인 비주얼. 텍스트는 가장자리에서 여백을 두어 잘리지 않게 배치하세요.

### Canva로 1200×630 이미지 만들기

1. [Canva](https://www.canva.com/) 로그인 후 **디자인 만들기** → **맞춤 크기** 선택.
2. **너비 1200 px**, **높이 630 px** 입력 후 **새 디자인 만들기**.
3. 배경, 로고, 슬로건(예: "XtheX - Global Outdoor Ad Marketplace")을 배치.
4. **다운로드** → **PNG** 선택 → `og-image.png`로 저장 후 `public/` 폴더에 넣기.

이미지가 없으면 SNS 공유 시 썸네일이 비어 보이므로, 배포 전 추가를 권장합니다.

---

## favicon.ico (브라우저 탭 아이콘)

- **경로**: `public/favicon.ico`
- **설정**: `app/layout.tsx`의 `metadata.icons.icon`이 `/favicon.ico`로 지정되어 있음.
- **권장**: 32×32 또는 48×48 px 포함한 ICO. [Favicon.io](https://favicon.io/) 등으로 PNG에서 변환 가능.
- 추가 후 브라우저 캐시 비우고 탭 아이콘 변경 여부 확인.

---

## apple-touch-icon (iOS 홈 화면 추가용)

- **경로**: `public/apple-touch-icon.png`
- **설정**: `app/layout.tsx`의 `metadata.icons.apple`이 `/apple-touch-icon.png`로 지정되어 있음.
- **권장 크기**: **180 × 180 px** (Apple 권장). 투명/둥근 모서리는 OS가 처리.
- iOS에서 "홈 화면에 추가" 시 이 이미지가 앱 아이콘으로 사용됩니다.
