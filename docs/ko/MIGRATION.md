# 마이그레이션 가이드

이 가이드는 oh-my-claudecode의 모든 마이그레이션 경로를 다룹니다. 아래에서 현재 사용 중인 버전을 찾아주세요.

**관련 문서:**
- [GETTING-STARTED.md](GETTING-STARTED.md) — 설치 및 첫 번째 단계
- [ARCHITECTURE.md](ARCHITECTURE.md) — 시스템 설계 및 에이전트 모델
- [HOOKS.md](HOOKS.md) — 훅 시스템, 키워드 트리거, 스킬 활성화

---

## 목차

- [미출시: Team MCP 런타임 지원 종료 (CLI 전용)](#미출시-team-mcp-런타임-지원-종료-cli-전용)
- [v3.5.3 → v3.5.5: 테스트 수정 및 정리](#v353--v355-테스트-수정--정리)
- [v3.5.2 → v3.5.3: 스킬 통합](#v352--v353-스킬-통합)
- [v2.x → v3.0: 패키지 리네이밍 및 자동 활성화](#v2x--v30-패키지-리네이밍--자동-활성화)
- [v3.0 → v3.1: Notepad Wisdom 및 향상된 기능](#v30--v31-notepad-wisdom--향상된-기능)
- [v3.x → v4.0: 주요 아키텍처 개편 (히스토리)](#v3x--v40-주요-아키텍처-개편-히스토리)

---

## 미출시: Team MCP 런타임 지원 종료 (CLI 전용)

### 요약

`omc_run_team_start/status/wait/cleanup`은 런타임에서 완전히 지원이 종료되었습니다. 호출 시 다음을 반환합니다:

```json
{
  "code": "deprecated_cli_only",
  "message": "Legacy team MCP runtime tools are deprecated. Use the omc team CLI instead."
}
```

대신 CLI 명령어를 사용하세요:

- `omc team [N:agent-type] "<task>"`
- `omc team status <team-name>`
- `omc team shutdown <team-name> [--force]`
- `omc team api <operation> --input '<json>' --json`

### `omc ask` 환경 변수 별칭 종료 (Phase-1 호환성)

`OMC_ASK_*`가 advisor 실행을 위한 표준 방식이 되었습니다. Phase-1은 지원 종료 경고와 함께 `OMX_ASK_ADVISOR_SCRIPT` 및 `OMX_ASK_ORIGINAL_TASK`를 수락합니다. 별칭 완전 제거 예정일: **2026-06-30**.

### 마이그레이션 방법

1. MCP 런타임 도구 호출을 CLI 동등 명령으로 교체합니다.
2. 스킬/프롬프트에서 `/omc-teams ...` 구문을 `omc team ...` 구문으로 업데이트합니다.
3. 레거시 Team MCP 런타임은 이제 옵트인 방식으로만 사용 가능합니다 (기본 활성화 아님). 수동으로 활성화할 경우 응답은 지원 종료 호환성 출력으로만 취급하세요.

### 변환 예시

```bash
# 이전 (지원 종료된 런타임 경로)
mcp__team__omc_run_team_start(...)
mcp__team__omc_run_team_status({ job_id: ... })
mcp__team__omc_run_team_wait({ job_id: ... })
mcp__team__omc_run_team_cleanup({ job_id: ... })

# 새 방식 (CLI 우선)
omc team 2:codex "review auth flow"
omc team status review-auth-flow
omc team shutdown review-auth-flow --force
omc team api list-tasks --input '{"team_name":"review-auth-flow"}' --json
```

---

## v3.5.3 → v3.5.5: 테스트 수정 및 정리

### 요약

테스트 스위트 문제를 수정하고 v3.5.3의 스킬 통합을 이어가는 유지보수 릴리스입니다.

### 변경 사항

**테스트 수정:**

- delegation-enforcer 테스트를 스킵 처리 (구현 대기 중)
- 에이전트 어트리뷰션에 대한 분석 기대값 수정
- 나머지 모든 테스트가 정상적으로 통과

**스킬 통합:**

- v3.5.3에서 시작된 정리 작업 계속
- 지원 종료된 `cancel-*` 스킬 제거 (대신 `/cancel` 사용)
- 최종 스킬 수: 37개 핵심 스킬

### 마이그레이션 단계

1. **호환성 변경 없음** - 모든 기능 유지
2. **테스트 스위트**는 이제 `npm run test:run`으로 정상 실행됨
3. **지원 종료된 스킬** 제거 (v3.5.3에서 이미 교체됨)

### 개발자를 위한 안내

지원 종료된 `cancel-*` 스킬에 의존하고 있었다면, 활성 모드를 자동 감지하는 통합 `/cancel` 명령으로 업데이트하세요.

---

## v3.5.2 → v3.5.3: 스킬 통합

### 요약

8개의 지원 종료된 스킬이 제거되었습니다. 통합 `/cancel` 및 `/omc-setup` 명령으로 대체됩니다.

### 제거된 스킬

다음 스킬들은 v3.5.3에서 **완전히 제거**되었습니다:

| 제거된 스킬 | 대체 명령 |
| -------------------- | -------------------------------------- |
| `cancel-autopilot`   | `/oh-my-claudecode:cancel`             |
| `cancel-ralph`       | `/oh-my-claudecode:cancel`             |
| `cancel-ultrawork`   | `/oh-my-claudecode:cancel`             |
| `cancel-ultraqa`     | `/oh-my-claudecode:cancel`             |
| `omc-default`        | `/oh-my-claudecode:omc-setup --local`  |
| `omc-default-global` | `/oh-my-claudecode:omc-setup --global` |
| `planner`            | `/oh-my-claudecode:plan`               |

### 변경 사항

**v3.5.3 이전:**

```bash
/oh-my-claudecode:cancel-ralph      # ralph 개별 취소
/oh-my-claudecode:omc-default       # 로컬 프로젝트 설정
/oh-my-claudecode:planner "task"    # 계획 시작
```

**v3.5.3 이후:**

```bash
/oh-my-claudecode:cancel            # 활성 모드 자동 감지 및 취소
/oh-my-claudecode:omc-setup --local # 로컬 프로젝트 설정
/oh-my-claudecode:plan "task"       # 계획 시작 (인터뷰 모드 포함)
```

### 새 기능

**새 스킬: `/learn-about-omc`**

- OMC 사용 패턴 분석
- 개인화된 권장 사항 제공
- 활용도가 낮은 기능 식별

**Plan 스킬이 이제 합의 모드를 지원합니다:**

```bash
/oh-my-claudecode:plan --consensus "task"  # Critic 검토를 통한 반복적 계획
/oh-my-claudecode:ralplan "task"           # plan --consensus의 별칭
```

### 마이그레이션 단계

1. **별도 조치 불필요** - 통합 `/cancel` 명령은 이미 v3.5에서 작동하고 있었음
2. **제거된 명령을 참조하는 스크립트 업데이트**
3. CLAUDE.md 설정 업데이트를 원한다면 **`/omc-setup` 재실행**

### 스킬 수

- v3.5: 42개 스킬
- v3.5.3: 37개 스킬 (8개 제거, 3개 추가)

---

## v2.x → v3.0: 패키지 리네이밍 및 자동 활성화

### 요약

기존 명령어가 계속 작동합니다! 하지만 이제는 그것들이 필요하지 않습니다.

**3.0 이전:** `/oh-my-claudecode:ralph "task"`, `/oh-my-claudecode:ultrawork "task"` 등 25개 이상의 명령을 명시적으로 호출해야 했음

**3.0 이후:** 자연스럽게 작업하면 됩니다 - Claude가 올바른 동작을 자동 활성화합니다. 초기 설정: "setup omc"라고 말하기만 하면 됨

### 프로젝트 리브랜딩

프로젝트의 목적을 더 잘 반영하고 검색성을 높이기 위해 리브랜딩되었습니다.

- **프로젝트/브랜드 이름**: `oh-my-claudecode` (GitHub 저장소, 플러그인 이름, 명령어)
- **npm 패키지 이름**: `oh-my-claude-sisyphus` (변경 없음)

> **왜 다른가요?** npm 패키지 이름 `oh-my-claude-sisyphus`는 기존 설치와의 하위 호환성을 위해 유지되었습니다. 프로젝트, GitHub 저장소, 플러그인, 모든 명령어는 `oh-my-claudecode`를 사용합니다.

#### npm 설치 명령어 (변경 없음)

```bash
npm i -g oh-my-claude-sisyphus@latest
```

### 변경 사항

#### 이전 (2.x): 명시적 명령어

각 모드에 대해 특정 명령어를 기억하고 명시적으로 호출해야 했습니다:

```bash
# 2.x 워크플로우: 여러 명령어, 많은 것을 기억해야 함
/oh-my-claudecode:ralph "implement user authentication"       # 지속성 모드
/oh-my-claudecode:ultrawork "refactor the API layer"          # 최대 병렬성
/oh-my-claudecode:planner "plan the new dashboard"            # 계획 인터뷰
/oh-my-claudecode:deepsearch "find database schema files"     # 심층 검색
/oh-my-claudecode:git-master "commit these changes"           # Git 전문가
/oh-my-claudecode:deepinit ./src                              # 코드베이스 인덱싱
/oh-my-claudecode:analyze "why is this test failing?"         # 심층 분석
```

#### 이후 (3.0): 자동 활성화 + 키워드

자연스럽게 작업하세요. Claude가 의도를 감지하고 자동으로 동작을 활성화합니다:

```bash
# 3.0 워크플로우: 자연스럽게 말하거나 선택적 키워드 사용
"don't stop until user auth is done"                # ralph-loop 자동 활성화
"fast: refactor the entire API layer"               # ultrawork 자동 활성화
"plan: design the new dashboard"                    # 계획 자동 활성화
"ralph ulw: migrate the database"                   # 조합: 지속성 + 병렬성
"find all database schema files"                    # 검색 모드 자동 활성화
"commit these changes properly"                     # git 전문가 자동 활성화
```

### 에이전트 명명 표준

에이전트 명명은 이제 엄격하게 설명적이고 역할 기반입니다 (예: `architect`, `planner`, `analyst`, `critic`, `document-specialist`, `designer`, `writer`, `vision`, `executor`).

프롬프트, 명령어, 문서, 스크립트 전반에서 표준 역할 이름을 사용하세요. 새 콘텐츠에 신화 스타일이나 레거시 별칭을 도입하지 마세요.

### 설정 파일 이름 변경

v3.0에서 설정 파일 하나가 이름이 변경되었습니다:

- **이전**: `~/.claude/omc/mnemosyne.json`
- **새 이름**: `~/.claude/omc/learner.json`

모든 디렉토리 경로(`.omc/`, `~/.omc/`, `~/.claude/skills/omc-learned/`)와 환경 변수 이름(`OMC_*`)은 v2.x와 동일합니다.

### 명령어 매핑

모든 2.x 명령어가 계속 작동합니다. 변경 사항은 다음과 같습니다:

| 2.x 명령어 | 3.0 동등 표현 | 작동 여부 |
| -------------------------------------- | -------------------------------------------------- | ---------------------- |
| `/oh-my-claudecode:ralph "task"`       | "don't stop until done"이라고 말하거나 `ralph` 키워드 사용 | ✅ 예 (두 방법 모두) |
| `/oh-my-claudecode:ultrawork "task"`   | "fast" 또는 "parallel"이라고 말하거나 `ulw` 키워드 사용 | ✅ 예 (두 방법 모두) |
| `/oh-my-claudecode:ultrawork-ralph`    | "ralph ulw:" 접두사 사용                            | ✅ 예 (키워드 조합) |
| `/oh-my-claudecode:planner "task"`     | "plan this"라고 말하거나 `plan` 키워드 사용         | ✅ 예 (두 방법 모두) |
| `/oh-my-claudecode:plan "description"` | 자연스럽게 계획 시작                                | ✅ 예 |
| `/oh-my-claudecode:review [path]`      | 일반적으로 호출                                     | ✅ 예 (변경 없음) |
| `/oh-my-claudecode:deepsearch "query"` | "find" 또는 "search"라고 말하기                     | ✅ 예 (자동 감지) |
| `/oh-my-claudecode:analyze "target"`   | "analyze"라고 말하면 debugger/architect 에이전트로 라우팅 | ✅ 예 (키워드 라우팅) |
| `/oh-my-claudecode:deepinit [path]`    | 일반적으로 호출                                     | ✅ 예 (변경 없음) |
| `/oh-my-claudecode:git-master`         | "git", "commit", "atomic commit"이라고 말하기       | ✅ 예 (자동 감지) |
| `/oh-my-claudecode:frontend-ui-ux`     | "UI", "styling", "component", "design"이라고 말하기 | ✅ 예 (자동 감지) |
| `/oh-my-claudecode:note "content"`     | "remember this" 또는 "save this"라고 말하기         | ✅ 예 (자동 감지) |
| `/oh-my-claudecode:cancel-ralph`       | "stop", "cancel", "abort"라고 말하기                | ✅ 예 (자동 감지) |
| `/oh-my-claudecode:omc-doctor`         | 일반적으로 호출                                     | ✅ 예 (변경 없음) |
| 기타 모든 명령어                        | 기존과 동일하게 작동                                | ✅ 예 |

### 매직 키워드

키워드(`ralph`, `ralplan`, `ulw`/`ultrawork`, `plan`)는 메시지 어디에든 포함되면 특정 실행 모드를 트리거합니다. 자연어도 명시적 키워드 없이 의도를 자동 감지합니다.

전체 키워드 레퍼런스, 트리거 패턴, 취소 동작에 대해서는 [HOOKS.md](HOOKS.md)를 참조하세요.

### 마이그레이션 단계

기존 설정을 마이그레이션하려면 다음 단계를 따르세요:

#### 1. 이전 패키지 제거 (npm으로 설치한 경우)

```bash
npm uninstall -g oh-my-claudecode
```

#### 2. 플러그인 시스템을 통해 설치 (필수)

```bash
# Claude Code에서:
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
/plugin install oh-my-claudecode
```

> **참고**: npm/bun 글로벌 설치는 더 이상 지원되지 않습니다. 플러그인 시스템을 사용하세요.

#### 3. 설정 파일 이름 변경 (파일이 존재하는 경우)

```bash
mv ~/.claude/omc/mnemosyne.json ~/.claude/omc/learner.json
```

#### 4. 초기 설정 실행

Claude Code에서 "setup omc", "omc setup" 또는 동등한 자연어 표현을 말하세요.

이를 통해:

- 최신 CLAUDE.md 다운로드
- 32개 에이전트 설정
- 자동 동작 감지 활성화
- 지속 실행 시행 활성화
- 스킬 구성 설정

### 검증

마이그레이션 후 설정을 확인하세요:

1. **설치 확인**:

   ```bash
   npm list -g oh-my-claudecode
   ```

2. **디렉토리 존재 확인**:

   ```bash
   ls -la .omc/  # 프로젝트 디렉토리에서
   ls -la ~/.omc/  # 글로벌 디렉토리
   ```

3. **간단한 명령 테스트**:
   Claude Code에서 `/oh-my-claudecode:omc-help`를 실행하여 플러그인이 올바르게 로드되었는지 확인하세요.

### 3.0의 새 기능

#### 1. 학습 곡선 제로 운용

**명령어를 외울 필요 없습니다.** 자연스럽게 작업하세요:

```
이전: "OK, 속도를 위해 /oh-my-claudecode:ultrawork를 사용해야 해..."
이후: "빨리 처리해야 해, 빠르게 해줘!"
        ↓
        Claude: "ultrawork 모드를 활성화합니다..."
```

#### 2. 항상 위임 (자동)

복잡한 작업은 전문 에이전트로 자동 라우팅됩니다:

```
요청                          Claude의 행동
────────────────────     ────────────────────
"데이터베이스 리팩토링"    → architect에 위임
"UI 색상 수정"            → designer에 위임
"이 API 문서화"           → writer에 위임
"모든 오류 검색"          → explore에 위임
"이 크래시 디버깅"        → architect에 위임
```

위임을 요청할 필요 없습니다 - 자동으로 발생합니다.

#### 3. 학습된 스킬 (`/oh-my-claudecode:learner`)

문제 해결에서 재사용 가능한 인사이트 추출:

```bash
# 까다로운 버그 해결 후:
"Extract this as a skill"
    ↓
Claude가 패턴을 학습하고 저장
    ↓
다음에 키워드 일치 → 솔루션 자동 삽입
```

저장 위치:

- **프로젝트 수준**: `.omc/skills/` (버전 관리)
- **사용자 수준**: `~/.claude/skills/omc-learned/` (이식 가능)

#### 4. HUD 상태 표시줄 (실시간 오케스트레이션)

상태 표시줄에서 Claude가 하는 일을 확인하세요:

```
[OMC] ralph:3/10 | US-002 | ultrawork skill:planner | ctx:67% | agents:2 | todos:2/5
```

설치하려면 `/oh-my-claudecode:hud setup`을 실행하세요. 프리셋: minimal, focused, full.

#### 5. 3계층 메모리 시스템

중요한 지식이 컨텍스트 압축에서 살아남습니다:

```
<remember priority>API 클라이언트는 src/api/client.ts에 있음</remember>
    ↓
세션 시작 시 영구적으로 로드
    ↓
압축을 통해 절대 손실되지 않음
```

또는 `/oh-my-claudecode:note`를 사용하여 수동으로 발견 사항을 저장하세요:

```bash
/oh-my-claudecode:note Project uses PostgreSQL with Prisma ORM
```

#### 6. 구조화된 작업 추적 (PRD 지원)

**Ralph Loop가 이제 제품 요구사항 문서(PRD)를 사용합니다:**

```bash
/oh-my-claudecode:ralph-init "여러 공급자와 함께 OAuth 구현"
    ↓
사용자 스토리가 포함된 PRD 자동 생성
    ↓
각 스토리: 설명 + 수락 기준 + 통과/실패
    ↓
모든 스토리가 통과할 때까지 Ralph가 반복
```

#### 7. 지능적 지속 실행

**작업이 Claude가 멈추기 전에 완료됩니다:**

```
사용자: "사용자 대시보드 구현"
    ↓
Claude: "완료를 보장하기 위해 ralph-loop를 활성화합니다"
    ↓
할 일 목록 생성, 각 항목 처리
    ↓
모든 것이 검증 완료될 때만 중지
```

### 하위 호환성 참고

**참고**: v3.0은 v2.x 명명과의 하위 호환성을 유지하지 않습니다. 새 버전이 올바르게 작동하려면 위의 마이그레이션 단계를 완료해야 합니다.

---

## v3.0 → v3.1: Notepad Wisdom 및 향상된 기능

### 개요

버전 3.1은 v3.0과의 완전한 하위 호환성을 유지하면서 강력한 새 기능을 추가하는 마이너 릴리스입니다.

### 새 기능

#### 1. Notepad Wisdom 시스템

학습, 결정, 이슈, 문제점을 위한 계획 범위 wisdom 캡처.

**위치:** `.omc/notepads/{plan-name}/`

| 파일 | 목적 |
| -------------- | ---------------------------------- |
| `learnings.md` | 기술적 발견 및 패턴 |
| `decisions.md` | 아키텍처 및 설계 결정 |
| `issues.md`    | 알려진 이슈 및 해결 방법 |
| `problems.md`  | 차단 요소 및 도전 과제 |

**API:**

- `initPlanNotepad()` - 계획을 위한 노트패드 초기화
- `addLearning()` - 기술적 발견 기록
- `addDecision()` - 아키텍처 선택 기록
- `addIssue()` - 알려진 이슈 기록
- `addProblem()` - 차단 요소 기록
- `getWisdomSummary()` - 모든 wisdom 요약 가져오기
- `readPlanWisdom()` - 컨텍스트를 위한 전체 wisdom 읽기

#### 2. 위임 카테고리

모델 티어, 온도, 사고 예산에 자동 매핑하는 의미 기반 작업 분류.

| 카테고리 | 티어 | 온도 | 사고 | 용도 |
| -------------------- | ------ | ----------- | -------- | ----------------------------------------------- |
| `visual-engineering` | HIGH   | 0.7         | high     | UI/UX, 프론트엔드, 디자인 시스템 |
| `ultrabrain`         | HIGH   | 0.3         | max      | 복잡한 추론, 아키텍처, 심층 디버깅 |
| `artistry`           | MEDIUM | 0.9         | medium   | 창의적 해결책, 브레인스토밍 |
| `quick`              | LOW    | 0.1         | low      | 단순 조회, 기본 작업 |
| `writing`            | MEDIUM | 0.5         | medium   | 문서화, 기술 문서 작성 |

**자동 감지:** 카테고리는 프롬프트 키워드에서 자동으로 감지됩니다.

#### 3. 디렉토리 진단 도구

`lsp_diagnostics_directory` 도구를 통한 프로젝트 수준 타입 검사.

**전략:**

- `auto` (기본값) - 최적 전략 자동 선택, tsconfig.json이 존재하면 tsc 선호
- `tsc` - 빠름, TypeScript 컴파일러 사용
- `lsp` - 대체 방법, Language Server를 통해 파일 순회

**용도:** 커밋 전이나 리팩토링 후 전체 프로젝트 오류 확인.

#### 4. 세션 재개

백그라운드 에이전트를 `resume-session` 도구를 통해 전체 컨텍스트와 함께 재개할 수 있습니다.

### 마이그레이션 단계

버전 3.1은 드롭인 업그레이드입니다. 마이그레이션이 필요 없습니다!

```bash
npm update -g oh-my-claudecode
```

모든 기존 설정, 계획, 워크플로우가 변경 없이 계속 작동합니다.

### 새로 사용 가능한 도구

업그레이드 후 에이전트가 자동으로 다음에 접근할 수 있게 됩니다:

- Notepad wisdom API (실행 중 wisdom 읽기/쓰기)
- 위임 카테고리 (자동 분류)
- 디렉토리 진단 (프로젝트 수준 타입 검사)
- 세션 재개 (백그라운드 에이전트 상태 복원)

---

## v3.3.x → v3.4.0: 병렬 실행 및 고급 워크플로우

### 개요

버전 3.4.0은 v3.3.x와의 완전한 하위 호환성을 유지하면서 강력한 병렬 실행 모드와 고급 워크플로우 오케스트레이션을 도입합니다.

### 새 기능

#### 1. Pipeline: 순차 에이전트 체이닝

에이전트 간 데이터 전달로 체이닝:

```bash
/oh-my-claudecode:pipeline explore:haiku -> architect:opus -> executor:sonnet
```

**내장 프리셋:**

- `review` - explore → architect → critic → executor
- `implement` - planner → executor → tdd-guide
- `debug` - explore → architect → debugger
- `research` - parallel(document-specialist, explore) → architect → writer
- `refactor` - explore → architect-medium → executor-high → qa-tester
- `security` - explore → security-reviewer → executor → security-reviewer-low

#### 4. 통합 취소 명령어

활성 모드를 자동 감지하는 스마트 취소:

```bash
/oh-my-claudecode:cancel
# 또는 그냥 말하기: "stop", "cancel", "abort"
```

**자동 감지 및 취소:** autopilot, ralph, ultrawork, ultraqa, pipeline

**지원 종료 안내:**
개별 취소 명령어는 지원 종료되었지만 여전히 작동합니다:

- `/oh-my-claudecode:cancel-ralph` (지원 종료)
- `/oh-my-claudecode:cancel-ultraqa` (지원 종료)
- `/oh-my-claudecode:cancel-ultrawork` (지원 종료)
- `/oh-my-claudecode:cancel-autopilot` (지원 종료)

대신 `/oh-my-claudecode:cancel`을 사용하세요.

#### 6. Explore-High 에이전트

복잡한 코드베이스 탐색을 위한 Opus 기반 아키텍처 검색:

```typescript
Task(
  (subagent_type = "oh-my-claudecode:explore-high"),
  (model = "opus"),
  (prompt = "모든 인증 관련 코드 패턴 찾기..."),
);
```

**적합한 용도:** 아키텍처 분석, 횡단 관심사, 복잡한 리팩토링 계획

#### 7. 상태 관리 표준화

상태 파일이 이제 표준화된 경로를 사용합니다:

**표준 경로:**

- 로컬: `.omc/state/{name}.json`
- 글로벌: `~/.omc/state/{name}.json`

레거시 위치는 읽을 때 자동으로 마이그레이션됩니다.

#### 8. 키워드 충돌 해결

여러 실행 모드 키워드가 존재할 때:

**충돌 해결 우선순위:**
| 우선순위 | 조건 | 결과 |
|----------|-----------|--------|
| 1 (최고) | 단일 명시적 키워드 | 해당 모드 승 |
| 2 | "fast"/"parallel"만 있는 경우 | 설정에서 읽음 (`defaultExecutionMode`) |
| 3 (최저) | 설정 파일 없음 | 기본값 `ultrawork` |

**명시적 모드 키워드:** `ulw`, `ultrawork`
**일반 키워드:** `fast`, `parallel`

사용자는 `/oh-my-claudecode:omc-setup`을 통해 기본 모드 설정을 지정합니다.

### 마이그레이션 단계

버전 3.4.0은 드롭인 업그레이드입니다. 마이그레이션이 필요 없습니다!

```bash
npm update -g oh-my-claudecode
```

모든 기존 설정, 계획, 워크플로우가 변경 없이 계속 작동합니다.

### 새 설정 옵션

#### 기본 실행 모드

`~/.claude/.omc-config.json`에서 선호하는 실행 모드 설정:

```json
{
  "defaultExecutionMode": "ultrawork"
}
```

명시적 모드 키워드 없이 "fast"나 "parallel" 같은 일반 키워드를 사용하면 이 설정에 따라 활성화되는 모드가 결정됩니다.

### 호환성 변경 사항

없음. 모든 v3.3.x 기능과 명령어가 v3.4.0에서 계속 작동합니다.

### 새로 사용 가능한 도구

업그레이드 후 자동으로 다음에 접근할 수 있게 됩니다:

- Ultrapilot (병렬 autopilot)
- Swarm 조율
- Pipeline 워크플로우
- 통합 취소 명령어
- Explore-high 에이전트

### v3.4.0 모범 사례

#### 각 모드를 사용해야 할 때

| 시나리오 | 권장 모드 | 이유 |
| ----------------------- | ---------------- | ---------------------------------------------- |
| 멀티 컴포넌트 시스템 | `team N:executor` | 병렬 워커가 독립 컴포넌트를 처리 |
| 많은 소규모 수정 | `team N:executor` | 원자적 작업 클레이밍으로 중복 작업 방지 |
| 순차 의존성 | `pipeline`        | 단계 간 데이터 전달 |
| 단일 복잡 작업 | `autopilot`      | 완전 자율 실행 |
| 반드시 완료해야 함 | `ralph`          | 지속성 보장 |

#### 키워드 사용법

**명시적 모드 제어 (v3.4.0):**

```bash
"ulw: fix all errors"           # ultrawork (명시적)
"fast: implement feature"       # defaultExecutionMode 설정 읽기
```

**자연어 (여전히 작동):**

```bash
"don't stop until done"         # ralph
"parallel execution"            # defaultExecutionMode 읽기
"build me a todo app"           # autopilot
```

### 검증

업그레이드 후 새 기능을 확인하세요:

1. **설치 확인**:

   ```bash
   npm list -g oh-my-claudecode
   ```

2. **통합 취소 테스트**:

   ```bash
   /oh-my-claudecode:cancel
   ```

3. **상태 디렉토리 확인**:
   ```bash
   ls -la .omc/state/
   ```

---

## v3.x → v4.0: 주요 아키텍처 개편 (히스토리)

### 개요

버전 4.0은 주요 아키텍처 재설계로 출시되었습니다. 현재 프로젝트는 v4.8.x입니다.

v4.0 및 이후 릴리스에서 변경된 사항의 전체 목록은 [CHANGELOG.md](../CHANGELOG.md)를 참조하세요.

### v4.x의 주요 변경 사항

- Claude Code를 통한 플러그인 기반 설치 (npm 글로벌 설치 제거)
- 향상된 생명주기 관리를 갖춘 모듈식 에이전트 시스템
- MCP 런타임 팀 도구를 대체하는 통합 CLI (`omc team`)
- `.omc/state/` 아래 표준화된 상태 파일
- 현재 시스템 설계는 [ARCHITECTURE.md](ARCHITECTURE.md) 참조

### 마이그레이션 단계

1. v3.x npm 설치에서 오는 경우 **플러그인 시스템을 통해 재설치**:

   ```bash
   npm uninstall -g oh-my-claudecode
   # 그런 다음 Claude Code에서:
   /plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
   ```

2. **설정 재실행**:

   ```
   /oh-my-claudecode:omc-setup
   ```

3. 업그레이드하는 특정 v4.x 릴리스의 **[CHANGELOG.md](../CHANGELOG.md)에서 호환성 변경 사항 검토**.

### 최신 정보 유지

- [CHANGELOG.md](../CHANGELOG.md) — 전체 릴리스 노트
- [GitHub 저장소](https://github.com/Yeachan-Heo/oh-my-claudecode) — 공지 및 이슈

---

## 버전별 공통 시나리오

### 시나리오 1: 빠른 구현 작업

**2.x 워크플로우:**

```
/oh-my-claudecode:ultrawork "implement the todo list feature"
```

**3.0+ 워크플로우:**

```
"할 일 목록 기능을 빠르게 구현해줘"
    ↓
Claude: "최대 병렬성을 위해 ultrawork를 활성화합니다"
```

**결과:** 동일한 결과, 더 자연스러운 상호작용.

### 시나리오 2: 복잡한 디버깅

**2.x 워크플로우:**

```
/oh-my-claudecode:ralph "debug the memory leak"
```

**3.0+ 워크플로우:**

```
"워커 프로세스에 메모리 누수가 있어 - 고칠 때까지 멈추지 마"
    ↓
Claude: "완료를 보장하기 위해 ralph-loop를 활성화합니다"
```

**결과:** 자연어에서 더 많은 컨텍스트를 얻은 Ralph-loop.

### 시나리오 3: 전략적 계획

**2.x 워크플로우:**

```
/oh-my-claudecode:planner "design the new authentication system"
```

**3.0+ 워크플로우:**

```
"새 인증 시스템을 계획해줘"
    ↓
Claude: "계획 세션을 시작합니다"
    ↓
인터뷰 자동 시작
```

**결과:** 자연어로 트리거된 계획 인터뷰.

### 시나리오 4: 작업 중지

**2.x 워크플로우:**

```
/oh-my-claudecode:cancel-ralph
```

**3.0+ 워크플로우:**

```
"stop"
```

**결과:** Claude가 활성 작업을 지능적으로 취소합니다.

---

## 설정 옵션

### 프로젝트 범위 설정 (권장)

현재 프로젝트에만 oh-my-claudecode 적용:

```
/oh-my-claudecode:omc-default
```

생성: `./.claude/CLAUDE.md`

### 글로벌 설정

모든 Claude Code 세션에 적용:

```
/oh-my-claudecode:omc-default-global
```

생성: `~/.claude/CLAUDE.md`

**우선순위:** 두 파일이 모두 존재하면 프로젝트 설정이 글로벌 설정보다 우선합니다.

---

## FAQ

**Q: 키워드를 꼭 사용해야 하나요?**
A: 아닙니다. 키워드는 선택적 단축키입니다. Claude는 키워드 없이도 의도를 자동 감지합니다.

**Q: 이전 명령어가 작동하지 않게 되나요?**
A: 아닙니다. 모든 명령어는 마이너 버전(3.0 → 3.1)에 걸쳐 계속 작동합니다. 메이저 버전 변경(3.x → 4.0)에는 마이그레이션 경로가 제공됩니다.

**Q: 명시적 명령어를 선호한다면?**
A: 계속 사용하세요! `/oh-my-claudecode:ralph`, `/oh-my-claudecode:ultrawork`, `/oh-my-claudecode:plan`이 작동합니다. 참고: `/oh-my-claudecode:planner`는 이제 `/oh-my-claudecode:plan`으로 리디렉션됩니다.

**Q: Claude가 무엇을 하는지 어떻게 알 수 있나요?**
A: Claude가 주요 동작을 알려줍니다: "ralph-loop를 활성화합니다..." 또는 실시간 상태를 위해 `/oh-my-claudecode:hud`를 설정하세요.

**Q: 전체 명령어 목록은 어디에 있나요?**
A: 전체 명령어 레퍼런스는 [README.md](../README.md)를 참조하세요. 모든 명령어가 여전히 작동합니다.

**Q: 키워드와 자연어의 차이점은 무엇인가요?**
A: 키워드는 명시적 단축키입니다. 자연어는 자동 감지를 트리거합니다. 둘 다 작동합니다.

---

## 도움이 필요하신가요?

- **이슈 진단**: `/oh-my-claudecode:omc-doctor` 실행
- **모든 명령어 보기**: `/oh-my-claudecode:omc-help` 실행
- **실시간 상태 확인**: `/oh-my-claudecode:hud setup` 실행
- **상세 변경 로그 검토**: [CHANGELOG.md](../CHANGELOG.md) 참조
- **버그 신고**: [GitHub Issues](https://github.com/Yeachan-Heo/oh-my-claudecode/issues)

---

## 다음 단계

마이그레이션을 이해했으니:

1. **즉각적인 효과**: 작업에서 키워드(`ralph`, `ulw`, `plan`) 사용 시작
2. **새 사용자**: 설치 및 첫 번째 단계를 위해 [GETTING-STARTED.md](GETTING-STARTED.md) 읽기
3. **고급 사용**: 시스템 설계 및 에이전트 모델을 위해 [ARCHITECTURE.md](ARCHITECTURE.md) 확인
4. **훅/키워드 세부 사항**: 트리거 패턴 및 스킬 활성화를 위해 [HOOKS.md](HOOKS.md) 참조
5. **팀 온보딩**: 팀원들과 이 가이드 공유

oh-my-claudecode에 오신 것을 환영합니다!
