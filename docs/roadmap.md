# 로드맵 / 진행 상황 (Roadmap)

설계 문서: `~/.claude/plans/superpowers-lexical-bird.md`

## 완료

- **Phase 0** — 스캐폴드(Vite+TS+Vitest), 게임 루프/입력/카메라/RNG, 양피지 배경.
- **Phase 1** — 코어 루프(이동/포식/성장/XP), 석화 시선 + 독 숨결, 수탉+음파,
  레벨업 3카드, 진화(Egg→Lesser King 작동), HUD/타이틀/게임오버/승리, Forest 맵.
- **Phase 2** — 거울/물 반사 자해, 꼬리 후려치기(물 흐림/거울 덮기/넉백),
  거울잡이 적(이동식 거울), 물 웅덩이 산포, 반사/꼬리 업그레이드.
- **Phase 3** — 인간 적군 4종(사냥꾼·기사·사제·수탉 조련사) + 화살 발사체 시스템,
  기사 시선 저항(gazeResist), 사제 아군 치유, 조련사 수탉 소환, 맵별 인간 구성.
- **Phase 4** — 맵 5개(Forest→Farm→Monastery→Castle→Kingdom) 스테이지 전환,
  진행도(길이/스탯/업그레이드/진화) 이월, 스테이지 클리어 인터스티셜 + 진입 배너,
  진화 5단계 전부 도달 가능, **최종 승리(Kingdom 클리어)**. → 코어 게임 완성.

- **Phase 5** — 폴리시: 절차적 WebAudio 효과음(eat/gaze/poison/tail/hit/levelup/evolve/crow/arrow/
  summon/reflect/pick/stageClear/win/lose) + 환경 음악 + 음소거(M), 피격 플래시(hurtFlash),
  localStorage 최고기록 저장·표시(타이틀/게임오버/승리), 최종 밸런스(거울 반사 0.9→0.7).

## 상태: 전체 완성 ✅

Phase 0–5 모두 구현·검증 완료. 처음부터 끝까지 플레이 가능한 완성 브라우저 게임.

## 남은 선택 항목(요청 시)

- 일시정지/옵션 메뉴, 모바일 터치 조작, 추가 메타진행(해금), 성능 최적화(개체 수 많을 때),
  추가 콘텐츠(무기/적/먹이/업그레이드 확장), 더 정교한 절차적 아트.
