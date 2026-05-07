# vue-project

사내에서 사용하는 UI 컴포넌트를 정리/검증하기 위한 Vue 기반 프로젝트입니다.

## 프로젝트 목적

- 사내 서비스에 공통으로 사용하는 컴포넌트 샘플 관리
- 컴포넌트 동작 검증 및 유지보수 기준점 확보
- 기능 추가 이력 및 버전 정보 문서화

## 사내 기준 Vue 버전

실제 서비스와 맞추기 위해 Vue 버전을 사내 기준으로 고정해서 사용합니다.

- `vue`: `3.5.17`
- `@vue/compiler-sfc`: `3.5.17`

## 주요 버전 정보

핵심 실행 환경 및 주요 라이브러리 버전입니다.

- `node`: `^20.19.0 || >=22.12.0`
- `vite`: `^8.0.8`
- `typescript`: `~5.9.3`
- `pinia`: `^3.0.4`
- `vue-router`: `^5.0.5`
- `vuetify`: `^3.12.5`
- `ag-grid-vue3`: `^35.2.1`
- `vue3-apexcharts`: `^1.11.1`
- `@fullcalendar/vue3`: `^6.1.20`
- `@tiptap/vue-3`: `^3.22.4`
- `@vueup/vue-quill`: `^1.2.0`

## 추가 기능 목록

아래 항목에 이 프로젝트에 추가한 기능을 계속 누적 기록합니다.

- [x] Vuetify 기반 UI 컴포넌트 구성
- [x] AG Grid 연동
- [x] ApexCharts 연동
- [x] FullCalendar 연동
- [x] Tiptap 에디터 연동
- [x] Quill 에디터 연동
- [x] 폼 검증(`vee-validate`, `yup`) 구성

## 함께 사용 권장 프로젝트

프론트 컴포넌트 검증 및 실제 API 연동 테스트를 위해 아래 Spring 프로젝트와 함께 사용하는 것을 권장합니다.

- Spring 프로젝트: `https://github.com/used-comp-koboolean/spring-project`

### 함께 사용할 때 장점

- 프론트(Vue)와 백엔드(Spring) 간 API 규격을 실제와 유사하게 검증 가능
- 컴포넌트별 데이터 바인딩/요청-응답 흐름을 통합 시나리오로 확인 가능
- 사내 환경 기준으로 기능 점검 범위를 프론트 단독에서 전체 흐름으로 확장 가능

## 실행 방법

### 의존성 설치

```sh
npm install
```

### 개발 서버 실행

```sh
npm run dev
```

### 빌드 (타입 체크 포함)

```sh
npm run build
```
