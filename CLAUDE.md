# BASILISK: The Little King — 프로젝트 지침

## 언어: 항상 한국어로 답하기

이 프로젝트에서 사용자에게 보내는 **모든 응답은 한국어**로 작성한다.
사용자가 명시적으로 "영어로 설명해줘"라고 요청하기 전까지 한국어를 유지한다.
(코드/식별자/주석 등 기술 산출물은 관례상 영어 사용 가능. 대화·설명은 한국어.)

## 프로젝트 개요

2D 탑다운 생존 로그라이크 브라우저 게임. 뱀처럼 성장(snake growth) +
뱀파이어 서바이버류 레벨업 진행 + 중세 동물지(Aberdeen Bestiary) 양피지 비주얼.

- 스택: TypeScript + Vite(개발 도구만), HTML5 Canvas 2D, **런타임 의존성 0개**
- 아트: 코드로 그리는 절차적 아트(이미지 파일 없음). 렌더러는 교체 가능하게 분리
- 테스트: Vitest로 순수 로직 단위 테스트
- 설계 문서: `~/.claude/plans/superpowers-lexical-bird.md`

## 명령어

- `npm run dev` — 개발 서버 (Vite)
- `npm test` — 단위 테스트 (Vitest)
- `npm run build` — 타입체크 + 프로덕션 빌드
- `npm run typecheck` — 타입체크만

## 구조 메모

- `src/core/` — 게임 루프, 입력, 카메라, 수학, RNG, Game 상태머신
- `src/entities/` — 바실리스크(스네이크), 먹이, 적, 공유 타입
- `src/systems/` — 이동/스폰/전투/충돌/성장/레벨링/이펙트
- `src/weapons/` — 석화 시선(gaze), 독 숨결(poison)
- `src/progression/` — 스탯, 업그레이드, 진화
- `src/render/` — 렌더러, 팔레트, 양피지 배경, 스프라이트, UI(HUD/레벨업/스크린)
- `src/world/` — 맵/바이옴 정의
