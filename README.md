# 나만의 웹 만들기

학생들이 기획부터 화면 구성, 기능 연결, 테스트까지 직접 해보는 교육용
웹 제작 스튜디오입니다. 완성된 템플릿을 클릭해 조립하는 방식이 아니라,
캔버스에서 요소를 옮기고 크기를 조절하며 HTML, CSS, JavaScript까지
편집할 수 있습니다. 첫 시작 화면은 AI 캠프 기록장입니다.

## 주요 기능

- 자유 배치 캔버스에서 요소 드래그, 리사이즈, 방향키 이동
- 더블클릭 텍스트 편집과 레이어 순서·숨김·잠금 제어
- 위치, 크기, 회전, 투명도, 색, 테두리, 글꼴을 바꾸는 디자인 패널
- 제목, 글, 카드, 입력, 체크리스트, 이미지, 버튼, HTML 요소
- 버튼에 메시지, 링크, 기록 저장 동작 연결
- 선택한 HTML 및 프로젝트 CSS·JavaScript 직접 편집
- 데스크톱·모바일 미리보기, 브라우저 자동 저장, URL 공유
- Supabase 캠프 기록 저장과 연결 전 브라우저 임시 저장

웹 제작 프로젝트는 브라우저에 자동 저장됩니다. 학생이 입력한 이름,
활동 기록, 미션 체크 이력은 브라우저에 먼저 저장한 뒤 Supabase의
`camp_records` 테이블에도 전송합니다. 학생 웹에는 전체 기록 조회 권한을
제공하지 않습니다.

## Supabase 연결

1. Supabase SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql)을
   한 번 실행합니다.
2. `.env.example`을 참고해 아래 서버 환경변수를 설정합니다.

```bash
SUPABASE_URL=https://vypnobpmyadtcvxhtagn.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Vercel 운영 환경에도 같은 두 변수를 등록해야 합니다. Publishable Key는
Supabase 프로젝트의 Connect 또는 API Keys 화면에서 확인할 수 있습니다.
`service_role` 키는 사용하거나 브라우저에 노출하지 않습니다.

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

검증용 빌드와 테스트:

```bash
npm test
```

## 배포

이 프로젝트의 기본 배포 대상은 Vercel입니다. GitHub의 `main` 브랜치와
Vercel 프로젝트를 연결하면 이후 변경 사항도 자동으로 운영 환경에
배포할 수 있습니다.
