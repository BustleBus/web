# 📊 BustleBus Web Dashboard

> **React + Vite + TailwindCSS 기반 실시간 버스 데이터 시각화 대시보드 (Web Frontend)** <br>
>버스 혼잡도 데이터 모니터링 및 대용량 로그 시각화 관리 시스템

버슬버스 프로젝트의 웹 파트는 실시간으로 수집되는 대량의 버스 운행 데이터와 혼잡도 통계를 관리자에게 시각적으로 전달하는 대시보드 역할을 수행합니다. 수천 건 이상의 로그 데이터를 브라우저 부하 없이 매끄럽게 렌더링하기 위한 성능 최적화에 초점을 맞추어 개발되었습니다.

## 🛠 Built With (Tech Stack)

### Core
- ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

### Styling & UI
- ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
- **Radix UI**: 접근성이 보장된 Headless UI 컴포넌트
- **Shadcn/ui**: 재사용 가능한 컴포넌트 시스템
- **Lucide React**: 모던한 아이콘 라이브러리

### Data Visualization & Performance
- **ApexCharts**: 인터랙티브한 차트 및 데이터 시각화
- **TanStack Virtual**: 대량 데이터 리스트의 가상화 렌더링 최적화

## ✨ Key Features (Web)

- **가상화 스크롤 (Virtualized Scrolling)**: TanStack Virtual을 도입하여 브라우저 메모리 사용량을 최소화하면서 수천 개의 데이터 리스트를 부드럽게 렌더링합니다.
- **실시간 데이터 시각화**: ApexCharts를 활용하여 웹 브라우저 상에서 버스 혼잡도 히트맵과 통계 차트를 직관적으로 보여줍니다.
- **웹 접근성(Web Accessibility)**: WAI-ARIA 표준을 준수하는 Radix UI를 사용하여 키보드 및 스크린 리더 사용자를 지원합니다.
- **반응형 웹 디자인**: 데스크탑, 태블릿, 모바일 브라우저 환경에 맞춰 레이아웃이 유동적으로 조정됩니다.

## Architecture

![BustleBus Dashboard Demo](./readmeImg/architecture.png)

## 📺 UI / Demo
># **https://web-ten-nu-64.vercel.app/** <br>

| **메인 대시보드 (Overview)** | **상세 데이터 (List View)** |
| :---: | :---: |
| ![Main 1](./readmeImg/main1.png) | ![Main 2](./readmeImg/main2.png) |
| **검색 및 필터링 (Filtering)** | **히트맵 시각화 (Heatmap)** |
| ![Filter](./readmeImg/filter.png) | ![Heatmap](./readmeImg/hitmap.png) |



## 🚀 Getting Started

로컬 웹 환경에서 프로젝트를 실행하는 방법입니다.

### Prerequisites
- Node.js (v18 이상 권장)
- npm

### Installation

1. 웹 리포지토리를 클론합니다.
   ```bash
   git clone https://github.com/username/bustlebus-web.git
   cd bustlebus-web
   ```

2. 의존성 패키지를 설치합니다.
   ```bash
   npm install
   ```

3. 개발 서버를 실행합니다.
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:5173`으로 접속하여 확인합니다.

### Build

웹 프로덕션 배포를 위한 빌드:
```bash
npm run build
```

## 📂 Project Structure

```
src/
├── components/
│   ├── ui/               # 공통 UI 컴포넌트 (Button, Dialog 등)
│   └── Dashboard.tsx     # 웹 대시보드 메인 컴포넌트
├── lib/
│   ├── utils.ts          # 스타일 병합 등 유틸리티
│   └── chartUtils.ts     # 차트 데이터 가공 로직
├── App.tsx               # 라우팅 및 레이아웃 설정
├── main.tsx              # React Entry Point
└── index.css             # TailwindCSS 설정
```

