# 개발 메모 (Dev Notes)

> 나중에 작업할 때 헷갈리기 쉬운 함정/도구 기록.

## 디버그 훅

- `Game` 생성자에서 `import.meta.env.DEV`일 때만 `window.__game = this`를 노출한다.
  - 프로덕션 빌드에는 **포함되지 않음**(Vite가 `import.meta.env.DEV`를 false로 치환).
  - `window.__game.debug` 게터로 상태 스냅샷(phase/level/segments/evolution/kills/hp...).
  - 헤드리스 자동 검증에서 `window.__game.world`를 직접 읽어 가까운 먹이/적/위험요소 좌표를 계산.

## 헤드리스 Chrome 자동 검증 (CDP)

- 추가 의존성 없이 Node 22 내장 `WebSocket` + `fetch`로 DevTools 프로토콜에 직접 연결.
  스크립트는 `scratchpad/smoke*.mjs` 참고(세션 임시 폴더).
- **함정: 키 이벤트에 `text` 필드를 넣으면 `keyUp`이 키를 해제하지 못한다.**
  → 자동 조작에서 모든 키가 "눌린 채" 누적되어 바실리스크가 멈춤.
  반드시 `Input.dispatchKeyEvent`에 `text`를 **생략**하고 `keyDown`/`keyUp`만 보낼 것.
- 반사 자해를 검증할 땐 **꼬리 슬램을 끄고** 거울을 시선 거리(190) 안·꼬리 범위(130) 밖에 둘 것.
  안 그러면 자동 꼬리 슬램이 위험요소를 먼저 무력화해 반사가 안 잡힌다.

## 오디오 / 저장 (Phase 5)

- **오디오는 절차적**(이미지처럼 에셋 0개) — `src/audio/AudioEngine.ts`가 WebAudio로 합성.
  `AudioContext`는 **사용자 제스처에서만** 생성/재개됨(브라우저 자동재생 정책). `Game.update`가
  아무 입력에서나 `audio.ensure()` 호출. `M`으로 음소거.
- **시뮬레이션↔오디오 분리**: 시스템은 `sfx(world, "tag")`로 `world.sounds`에 태그만 쌓고,
  `Game.updatePlaying`이 매 틱 드레인해서 `audio.play(tag)`. 시스템은 오디오를 직접 모름(테스트 용이).
- **헤드리스에서 오디오 검증**: `--autoplay-policy=no-user-gesture-required`로 크롬 실행 →
  `window.__game.audio.enabled`로 컨텍스트 생성 확인(헤드리스는 실제 소리 없음, 예외 없음만 검증).
- **최고기록**: `src/core/storage.ts`(localStorage, try/catch 가드). 게임오버/승리 시 `recordRun()`이
  furthest-realm→time→kills 기준으로 갱신. 타이틀/게임오버/승리 화면에 표시.

## 아키텍처 원칙

- 시뮬레이션(엔티티/시스템)과 렌더 완전 분리 — 렌더는 교체 가능(절차적 아트 → 추후 PNG 가능).
- 엔티티 = 평범한 객체(클래스/상속 X), 시스템 = 함수. 순수 로직은 Vitest로 TDD.
- 고정 타임스텝 60Hz + 보간 렌더(`GameLoop`). 시드 RNG(Mulberry32)로 재현 가능.
- 무기는 쿨다운마다 바라보는 방향 자동 발사(조작은 이동뿐).
