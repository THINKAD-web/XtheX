# 파트너 로고 – 실제 이미지 넣기 가이드

메인 페이지 **파트너 로고 섹션**에 사용되는 이미지는 이 폴더(`public/logos/`)에 넣습니다.

## 파일명 (8개, 소문자·하이픈)

| 파일명 | 표시 이름 |
|--------|-----------|
| `jcdecaux.svg` | JCDecaux |
| `clear-channel.svg` | Clear Channel |
| `lamar.svg` | Lamar |
| `outfront.svg` | OUTFRONT |
| `stroer.svg` | Stroer |
| `global.svg` | Global |
| `primesight.svg` | Primesight |
| `ocean-outdoor.svg` | Ocean Outdoor |

## 실제 로고 다운로드

- **추천**: [seeklogo.com](https://seeklogo.com/)에서 회사명으로 검색 후 **SVG** 다운로드.
- 위 표의 **파일명 그대로** 저장해서 이 폴더에 넣으면 메인 페이지에 바로 반영됩니다.
- 형식: SVG 권장 (PNG/WebP도 가능). 표시 영역 160×60px 기준, 용량 50KB 이하 권장.

## 코드에서 사용

`app/page.tsx`의 `PARTNERS` 배열에서 각 항목이 `logo: "/logos/파일명.svg"` 형태로 연결되어 있으며, `next/image`로 렌더링합니다:

```tsx
<Image
  src={logo}
  alt={name}
  width={160}
  height={60}
  className="object-contain"
  priority={index < 4}  // 첫 4개 우선 로드, 나머지 lazy
/>
```
