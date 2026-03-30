# 레퍼런스 문서

oh-my-claudecode 빠른 참조 치트시트. 자세한 문서는 아래 링크된 집중 가이드를 참조하세요.

| 가이드 | 내용 |
|--------|------|
| [GETTING-STARTED.md](./GETTING-STARTED.md) | 설치, 첫 번째 세션, 설정 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 에이전트, 스킬, hooks, 상태 관리 |
| [HOOKS.md](./HOOKS.md) | Hook 시스템, 라이프사이클 이벤트, 매직 키워드 |
| [TOOLS.md](./TOOLS.md) | MCP 도구 (상태, 노트패드, LSP, AST grep, Python REPL) |

빠른 시작은 메인 [README.md](../README.md)를 참조하세요.

---

## 목차

- [설치](#설치)
- [설정](#설정)
- [CLI 명령어: ask/team/session](#cli-명령어-askteamsession)
- [레거시 MCP Team 런타임 도구 (폐기됨)](#레거시-mcp-team-런타임-도구-폐기됨)
- [에이전트](#에이전트)
- [스킬](#스킬)
- [슬래시 명령어](#슬래시-명령어)
- [Hooks 시스템](#hooks-시스템)
- [매직 키워드](#매직-키워드)
- [플랫폼 지원](#플랫폼-지원)
- [성능 모니터링](#성능-모니터링)
- [문제 해결](#문제-해결)
- [변경 로그](#변경-로그)

---

## 설치

**Claude Code 플러그인 방식만 지원됩니다.**

```bash
# 1단계: 마켓플레이스 추가
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode

# 2단계: 플러그인 설치
/plugin install oh-my-claudecode

# 3단계: 설정 실행
/oh-my-claudecode:omc-setup
```

**요구 사항:** Claude Code + Claude Max/Pro 구독 또는 `ANTHROPIC_API_KEY`.

> 전체 설치 단계, 플랫폼 참고 사항, 검증 방법은 [GETTING-STARTED.md](./GETTING-STARTED.md)를 참조하세요.

---

## 설정

| 범위 | 명령어 | 파일 |
|------|--------|------|
| 프로젝트 (권장) | `/oh-my-claudecode:omc-setup --local` | `./.claude/CLAUDE.md` |
| 전역 | `/oh-my-claudecode:omc-setup` | `~/.claude/CLAUDE.md` |

**설정 우선순위:** 기본값 → 사용자 config → 프로젝트 config → 환경 변수

### 주요 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OMC_STATE_DIR` | _(미설정)_ | 중앙집중식 상태 디렉토리; worktree 삭제 후에도 상태 보존 |
| `OMC_PARALLEL_EXECUTION` | `true` | 병렬 에이전트 실행 활성화/비활성화 |
| `OMC_LSP_TIMEOUT_MS` | `15000` | LSP 요청 타임아웃 (ms) |
| `DISABLE_OMC` | _(미설정)_ | 임의의 값으로 설정하면 모든 OMC hook 비활성화 |
| `OMC_SKIP_HOOKS` | _(미설정)_ | 건너뛸 hook 이름 목록 (쉼표로 구분) |
| `OMC_BRIDGE_SCRIPT` | _(자동 감지)_ | Python 브릿지 스크립트 경로 |
| `OMC_CODEX_DEFAULT_MODEL` | _(공급자 기본값)_ | Codex CLI 워커의 기본 모델 |
| `OMC_GEMINI_DEFAULT_MODEL` | _(공급자 기본값)_ | Gemini CLI 워커의 기본 모델 |

#### 중앙집중식 상태

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export OMC_STATE_DIR="$HOME/.claude/omc"
```

상태는 `~/.claude/omc/{project-identifier}/`에 저장됩니다 (git 리모트 URL의 해시).

### 에이전트 모델 재정의

```jsonc
// .claude/omc.jsonc
{
  "agents": {
    "explore": { "model": "sonnet" },
    "executor": { "model": "opus" },
    "writer": { "model": "haiku" }
  }
}
```

### Stop 콜백 알림

```bash
omc config-stop-callback telegram --enable --token <bot_token> --chat <chat_id>
omc config-stop-callback discord --enable --webhook <url>
omc config-stop-callback telegram --add-tag alice
omc config-stop-callback discord --show
```

> 전체 설정 옵션 (모델 라우팅, 매직 키워드 사용자 정의, CLAUDE.md 설정)은 [GETTING-STARTED.md](./GETTING-STARTED.md)를 참조하세요.

---

## CLI 명령어: ask/team/session

### `omc ask`

```bash
omc ask claude "review this patch"
omc ask codex "review from a security perspective"
omc ask gemini --prompt "suggest UX improvements"
omc ask claude --agent-prompt executor --prompt "create an implementation plan"
```

- 공급자 매트릭스: `claude | codex | gemini`
- 아티팩트: `.omc/artifacts/ask/{provider}-{slug}-{timestamp}.md`
- 스킬 단축키: `/oh-my-claudecode:ask`

### `omc team` (CLI 런타임 인터페이스)

```bash
omc team 2:codex "review auth flow"
omc team status review-auth-flow
omc team shutdown review-auth-flow --force
omc team api claim-task --input '{"team_name":"auth-review","task_id":"1","worker":"worker-1"}' --json
```

지원되는 진입점: 직접 시작, `status`, `shutdown`, `api`.

### `omc session search`

```bash
omc session search "team leader stale"
omc session search notify-hook --since 7d
omc session search provider-routing --project all --json
```

- 기본적으로 현재 프로젝트 범위; `--project all`은 모든 로컬 트랜스크립트 검색
- `--limit`, `--session`, `--since`, `--context`, `--case-sensitive`, `--json` 지원
- MCP 인터페이스: `session_search`

---

## 레거시 MCP Team 런타임 도구 (폐기됨)

Team MCP 런타임 서버는 **기본적으로 활성화되지 않습니다**. 대신 `omc team ...` CLI를 사용하세요:

| 폐기된 도구 | 대체 방법 |
|------------|---------|
| `omc_run_team_start` | `omc team [N:agent-type] "<task>"` |
| `omc_run_team_status` | `omc team status <team-name>` |
| `omc_run_team_wait` | `omc team status <team-name>` (모니터링) |
| `omc_run_team_cleanup` | `omc team shutdown <team-name> [--force]` |

---

## 에이전트

Task 도구로 호출 시 항상 `oh-my-claudecode:` 접두사를 사용하세요. 에이전트 설명 및 위임 규칙은 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참조하세요.

### 도메인 및 티어별 분류

| 도메인 | LOW (Haiku) | MEDIUM (Sonnet) | HIGH (Opus) |
|--------|-------------|-----------------|-------------|
| **분석** | `architect-low` | `architect-medium` | `architect` |
| **실행** | `executor-low` | `executor` | `executor-high` |
| **검색** | `explore` | — | `explore-high` |
| **연구** | — | `document-specialist` | — |
| **프론트엔드** | `designer-low` | `designer` | `designer-high` |
| **문서** | `writer` | — | — |
| **계획** | — | — | `planner` |
| **비평** | — | — | `critic` |
| **사전 계획** | — | — | `analyst` |
| **테스팅** | — | `qa-tester` | — |
| **추적** | — | `tracer` | — |
| **보안** | `security-reviewer-low` | `security-reviewer` | — |
| **빌드** | — | `debugger` | — |
| **TDD** | — | `test-engineer` | — |
| **코드 리뷰** | — | — | `code-reviewer` |
| **데이터 과학** | — | `scientist` | `scientist-high` |
| **Git** | — | `git-master` | — |
| **단순화** | — | — | `code-simplifier` |

### 에이전트 선택 가이드

| 작업 유형 | 최적 에이전트 | 모델 |
|----------|-------------|------|
| 빠른 코드 조회 / 파일 찾기 | `explore` | haiku |
| 복잡한 아키텍처 검색 | `explore-high` | opus |
| 단순 코드 변경 | `executor-low` | haiku |
| 기능 구현 | `executor` | sonnet |
| 복잡한 리팩토링 | `executor-high` | opus |
| 단순/복잡 디버깅 | `debugger` / `architect` | sonnet / opus |
| UI 컴포넌트 / 시스템 | `designer` / `designer-high` | sonnet / opus |
| 문서 작성 | `writer` | haiku |
| 문서/API 연구 | `document-specialist` | sonnet |
| 전략적 계획 수립 | `planner` | opus |
| 계획 검토/비평 | `critic` | opus |
| 사전 계획 분석 | `analyst` | opus |
| 대화형 CLI 테스트 | `qa-tester` | sonnet |
| 증거 기반 추적 | `tracer` | sonnet |
| 보안 리뷰 / 빠른 스캔 | `security-reviewer` / `security-reviewer-low` | sonnet / haiku |
| TDD 워크플로우 | `test-engineer` | sonnet |
| 코드 리뷰 | `code-reviewer` | opus |
| 데이터 분석 | `scientist` / `scientist-high` | sonnet / opus |
| Git 작업 | `git-master` | sonnet |
| 코드 단순화 | `code-simplifier` | opus |

---

## 스킬

스킬 내부 구조 및 조합 레이어는 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참조하세요.

| 스킬 | 트리거 / 명령어 | 설명 |
|------|----------------|------|
| `autopilot` | `autopilot`, `build me`, `I want a` | 아이디어부터 동작하는 코드까지 완전 자율 실행 |
| `ralph` | `ralph`, `don't stop`, `must complete` | 검증 완료까지 지속 루프 |
| `ultrawork` | `ultrawork`, `ulw` | 최대 병렬 처리량 모드 |
| `team` | `/oh-my-claudecode:team` | 조율된 멀티 에이전트 워크플로우 (5단계 파이프라인) |
| `omc-teams` | `/oh-my-claudecode:omc-teams` | tmux 패널에서 CLI 워커 실행 (Codex, Gemini 등) |
| `ccg` | `ccg`, `claude-codex-gemini` | 3-모델 워크플로우: Codex + Gemini, Claude가 종합 |
| `ultraqa` | 자동 (autopilot 내) | 목표 달성까지 QA 사이클 반복 |
| `plan` | `/oh-my-claudecode:omc-plan` | 인터뷰 워크플로우를 포함한 전략적 계획 수립 |
| `ralplan` | `ralplan` | 합의 계획 수립 (Planner + Architect + Critic 루프) |
| `deep-interview` | `deep interview`, `ouroboros` | 모호성 게이팅이 있는 소크라테스식 심층 인터뷰 |
| `deepinit` | `/oh-my-claudecode:deepinit` | 계층적 AGENTS.md 문서 생성 |
| `sciomc` | `/oh-my-claudecode:sciomc` | 병렬 과학자 오케스트레이션 |
| `external-context` | `/oh-my-claudecode:external-context` | 병렬 document-specialist 연구 |
| `ai-slop-cleaner` | `deslop`, `anti-slop`, 정리 + slop 감지 | AI slop 정리 워크플로우 |
| `trace` | `/oh-my-claudecode:trace` | 병렬 tracer 가설을 이용한 증거 기반 추적 |
| `ask` | `/oh-my-claudecode:ask` | Claude/Codex/Gemini에 질문하고 아티팩트 캡처 |
| `cancel` | `cancelomc`, `stopomc` | 활성 모드 통합 취소 |
| `hud` | `/oh-my-claudecode:hud` | HUD/상태줄 설정 |
| `omc-setup` | `/oh-my-claudecode:omc-setup` | 일회성 설정 마법사 |
| `omc-doctor` | `/oh-my-claudecode:omc-doctor` | 설치 문제 진단 및 수정 |
| `learner` | `/oh-my-claudecode:learner` | 세션에서 재사용 가능한 스킬 추출 |
| `skill` | `/oh-my-claudecode:skill` | 로컬 스킬 관리 (목록/추가/제거/검색/편집) |
| `release` | `/oh-my-claudecode:release` | 자동화된 릴리즈 워크플로우 |
| `configure-notifications` | `/oh-my-claudecode:configure-notifications` | Discord/Telegram/Slack 알림 설정 |
| `mcp-setup` | `/oh-my-claudecode:mcp-setup` | MCP 서버 설정 |
| `setup` | `/oh-my-claudecode:setup` | 통합 설정 진입점 |
| `project-session-manager` | `/oh-my-claudecode:project-session-manager` | 격리된 개발 환경 관리 (worktree + tmux) |
| `writer-memory` | `/oh-my-claudecode:writer-memory` | 작성 프로젝트용 에이전트 메모리 시스템 |

---

## 슬래시 명령어

모든 스킬은 `/oh-my-claudecode:<name>`으로 사용할 수 있습니다. 주요 명령어:

| 명령어 | 설명 |
|--------|------|
| `/oh-my-claudecode:autopilot <task>` | 완전 자율 실행 |
| `/oh-my-claudecode:ultrawork <task>` | 최대 성능 모드 |
| `/oh-my-claudecode:team <N>:<agent> <task>` | 조율된 멀티 에이전트 워크플로우 |
| `/oh-my-claudecode:ralph <task>` | 지속 루프 (`--critic=architect\|critic\|codex`) |
| `/oh-my-claudecode:ultraqa <goal>` | 자율 QA 사이클링 |
| `/oh-my-claudecode:omc-plan <description>` | 계획 수립 세션 |
| `/oh-my-claudecode:ralplan <description>` | 합의 계획 수립 (고위험 작업에는 `--deliberate`) |
| `/oh-my-claudecode:deep-interview <idea>` | 실행 전 소크라테스식 인터뷰 |
| `/oh-my-claudecode:deepinit [path]` | AGENTS.md 파일로 코드베이스 인덱싱 |
| `/oh-my-claudecode:sciomc <topic>` | 병렬 연구 오케스트레이션 |
| `/oh-my-claudecode:ai-slop-cleaner <target>` | AI slop 정리 (`--review`는 리뷰어 전용) |
| `/oh-my-claudecode:trace` | 증거 기반 추적 레인 |
| `/oh-my-claudecode:learner` | 세션에서 재사용 가능한 스킬 추출 |
| `/oh-my-claudecode:note <content>` | notepad.md에 메모 저장 |
| `/oh-my-claudecode:cancel` | 통합 취소 |
| `/oh-my-claudecode:setup` | 통합 설정 (`setup`, `setup doctor`, `setup mcp`) |
| `/oh-my-claudecode:omc-setup` | 일회성 설정 마법사 |
| `/oh-my-claudecode:omc-doctor` | 설치 문제 진단 및 수정 |
| `/oh-my-claudecode:hud` | HUD 상태줄 설정 |
| `/oh-my-claudecode:release` | 자동화된 릴리즈 워크플로우 |
| `/oh-my-claudecode:mcp-setup` | MCP 서버 설정 |
| `/oh-my-claudecode:psm <arguments>` | project session manager의 폐기된 별칭 |

---

## Hooks 시스템

OMC는 11개의 라이프사이클 이벤트에 걸쳐 20개의 hook을 포함합니다. 전체 hook 문서 및 라이프사이클 이벤트는 [HOOKS.md](./HOOKS.md)를 참조하세요.

### 라이프사이클 이벤트별 Hook 스크립트 (요약)

| 이벤트 | 스크립트 |
|--------|---------|
| `UserPromptSubmit` | `keyword-detector.mjs`, `skill-injector.mjs` |
| `SessionStart` | `session-start.mjs`, `project-memory-session.mjs`, `setup-init.mjs`, `setup-maintenance.mjs` |
| `PreToolUse` | `pre-tool-enforcer.mjs` |
| `PermissionRequest` | `permission-handler.mjs` |
| `PostToolUse` | `post-tool-verifier.mjs`, `project-memory-posttool.mjs` |
| `PostToolUseFailure` | `post-tool-use-failure.mjs` |
| `SubagentStart` | `subagent-tracker.mjs` (시작) |
| `SubagentStop` | `subagent-tracker.mjs` (종료), `verify-deliverables.mjs` |
| `PreCompact` | `pre-compact.mjs`, `project-memory-precompact.mjs` |
| `Stop` | `context-guard-stop.mjs`, `persistent-mode.cjs`, `code-simplifier.mjs` |
| `SessionEnd` | `session-end.mjs` |

### Hooks 비활성화

```bash
export DISABLE_OMC=1                          # 모든 hook 비활성화
export OMC_SKIP_HOOKS="keyword-detector,notepad"  # 특정 hook 건너뛰기
```

### Code Simplifier Hook (옵트인)

```json
{
  "codeSimplifier": {
    "enabled": true,
    "extensions": [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs"],
    "maxFiles": 10
  }
}
```

Stop 시 최근 수정된 파일을 `code-simplifier` 에이전트에 자동으로 위임합니다. 기본적으로 비활성화됩니다.

---

## 매직 키워드

이 문구들을 자연어 프롬프트에 포함하면 모드가 활성화됩니다. 슬래시 명령어 불필요. 키워드 감지 동작 방식은 [HOOKS.md](./HOOKS.md)를 참조하세요.

| 키워드 | 효과 |
|--------|------|
| `ultrawork`, `ulw`, `uw` | 병렬 에이전트 오케스트레이션 |
| `autopilot`, `build me`, `I want a`, `auto-pilot`, `full auto`, `fullsend`, `e2e this` | 완전 자율 실행 |
| `ralph`, `don't stop`, `must complete`, `until done` | 검증 완료까지 지속 |
| `ccg`, `claude-codex-gemini` | Claude-Codex-Gemini 3-모델 오케스트레이션 |
| `ralplan` | 반복적 계획 합의 |
| `deep interview`, `ouroboros` | 소크라테스식 심층 인터뷰 |
| `deepsearch`, `search the codebase`, `find in codebase` | 코드베이스 집중 검색 모드 |
| `deepanalyze`, `deep-analyze` | 심층 분석 모드 |
| `ultrathink`, `think hard`, `think deeply` | 확장 추론 모드 |
| `tdd`, `test first`, `red green` | TDD 워크플로우 강제 |
| `deslop`, `anti-slop`, 정리 + slop 감지 | AI slop 정리 |
| `code review`, `review code` | 포괄적 코드 리뷰 모드 |
| `security review`, `review security` | 보안 집중 리뷰 모드 |
| `cancelomc`, `stopomc` | 모든 활성 모드 취소 |

**우선순위 순서 (높은 것부터):** `cancel` → `ralph` → `autopilot` → `ultrawork` → `ccg` → `ralplan` → `deep-interview` → `ai-slop-cleaner` → `tdd` → `code-review` → `security-review` → `ultrathink` → `deepsearch` → `analyze`

> `team`은 자동 감지되지 않습니다; `/oh-my-claudecode:team`을 명시적으로 사용하세요.

---

## 플랫폼 지원

### 운영체제

| 플랫폼 | 설치 방법 | Hook 유형 |
|--------|----------|---------|
| **macOS** | Claude Code 플러그인 | Bash (.sh) |
| **Linux** | Claude Code 플러그인 | Bash (.sh) |
| **Windows** | WSL2 권장 | Node.js (.mjs) |

> Bash hook은 macOS와 Linux 간 완벽하게 이식 가능합니다 (GNU 전용 의존성 없음).
> 네이티브 Windows 지원은 실험적입니다. OMC는 네이티브 Windows에서 사용할 수 없는 tmux가 필요합니다. WSL2를 사용하세요.
> macOS/Linux에서 Node.js hook을 사용하려면 `OMC_USE_NODE_HOOKS=1`을 설정하세요.

### 사용 가능한 도구

| 도구 | 상태 | 설명 |
|------|------|------|
| **Read** | 사용 가능 | 파일 읽기 |
| **Write** | 사용 가능 | 파일 생성 |
| **Edit** | 사용 가능 | 파일 수정 |
| **Bash** | 사용 가능 | 셸 명령어 실행 |
| **Glob** | 사용 가능 | 패턴으로 파일 찾기 |
| **Grep** | 사용 가능 | 파일 내용 검색 |
| **WebSearch** | 사용 가능 | 웹 검색 |
| **WebFetch** | 사용 가능 | 웹 페이지 가져오기 |
| **Task** | 사용 가능 | 서브에이전트 실행 |
| **TodoWrite** | 사용 가능 | 작업 추적 |

### LSP 도구

| 도구 | 설명 |
|------|------|
| `lsp_hover` | 해당 위치의 타입 정보 및 문서 |
| `lsp_goto_definition` | 심볼 정의로 이동 |
| `lsp_find_references` | 심볼의 모든 사용 위치 찾기 |
| `lsp_document_symbols` | 파일 아웃라인 (함수, 클래스 등) |
| `lsp_workspace_symbols` | 워크스페이스 전체에서 심볼 검색 |
| `lsp_diagnostics` | 파일의 오류, 경고, 힌트 |
| `lsp_diagnostics_directory` | 프로젝트 수준 타입 검사 |
| `lsp_prepare_rename` | 이름 변경이 유효한지 확인 |
| `lsp_rename` | 프로젝트 전체에서 심볼 이름 변경 |
| `lsp_code_actions` | 범위에 대해 사용 가능한 리팩토링 |
| `lsp_code_action_resolve` | 특정 코드 액션의 세부 정보 |
| `lsp_servers` | 사용 가능한 언어 서버 목록 |

> 언어 서버 필요: `typescript-language-server`, `pylsp`, `rust-analyzer`, `gopls` 등. 상태 확인은 `lsp_servers()` 실행.

### AST 도구

| 도구 | 설명 |
|------|------|
| `ast_grep_search` | AST 패턴을 사용한 구조적 코드 검색 |
| `ast_grep_replace` | 구조적 코드 변환 (먼저 `dryRun=true` 사용) |

> [@ast-grep/napi](https://ast-grep.github.io/) 사용. 메타 변수: `$VAR` (단일 노드), `$$$` (여러 노드).

> 예시가 포함된 전체 도구 문서는 [TOOLS.md](./TOOLS.md)를 참조하세요.

---

## 성능 모니터링

전체 문서는 [PERFORMANCE-MONITORING.md](./PERFORMANCE-MONITORING.md)를 참조하세요.

| 기능 | 설명 | 접근 방법 |
|------|------|---------|
| **에이전트 관측소** | 실시간 에이전트 상태, 효율성, 병목 현상 | HUD / API |
| **세션 종료 요약** | 세션별 지속 요약 | `.omc/sessions/*.json` |
| **세션 재생** | 사후 분석을 위한 이벤트 타임라인 | `.omc/state/agent-replay-*.jsonl` |
| **세션 검색** | 이전 트랜스크립트/세션 아티팩트 검색 | `omc session search`, `session_search` |
| **개입 시스템** | 지연된 에이전트, 비용 초과 자동 감지 | 자동 |

### CLI

```bash
omc hud                              # 현재 HUD 상태줄 렌더링
omc team status <team-name>          # 실행 중인 team 작업 검사
tail -20 .omc/state/agent-replay-*.jsonl
ls .omc/sessions/*.json
```

### HUD 설정 (`~/.claude/settings.json`)

```json
{
  "omcHud": {
    "preset": "focused",
    "elements": {
      "cwd": true,
      "gitBranch": true,
      "showTokens": true
    }
  }
}
```

| 요소 | 설명 | 기본값 |
|------|------|--------|
| `cwd` | 현재 작업 디렉토리 | `false` |
| `gitRepo` | Git 저장소 이름 | `false` |
| `gitBranch` | 현재 git 브랜치 | `false` |
| `omcLabel` | [OMC] 레이블 | `true` |
| `contextBar` | 컨텍스트 창 사용량 | `true` |
| `agents` | 활성 에이전트 수 | `true` |
| `todos` | Todo 진행 상황 | `true` |
| `ralph` | Ralph 루프 상태 | `true` |
| `autopilot` | Autopilot 상태 | `true` |
| `showTokens` | 트랜스크립트 기반 토큰 사용량 | `false` |

사용 가능한 프리셋: `minimal`, `focused`, `full`, `dense`, `analytics`, `opencode`

---

## 문제 해결

### 설치 진단

```bash
/oh-my-claudecode:omc-doctor
```

검사 항목: 의존성, 설정 오류, hook 상태, 에이전트 가용성, 스킬 등록.

### HUD 설정

```bash
/oh-my-claudecode:hud setup
```

### 일반적인 문제

| 문제 | 해결 방법 |
|------|---------|
| 명령어를 찾을 수 없음 | `/oh-my-claudecode:omc-setup` 재실행 |
| Hook이 실행되지 않음 | 권한 확인: `chmod +x ~/.claude/hooks/**/*.sh` |
| 에이전트가 위임되지 않음 | CLAUDE.md가 로드되었는지 확인: `./.claude/CLAUDE.md` 또는 `~/.claude/CLAUDE.md` |
| LSP 도구가 작동하지 않음 | `npm install -g typescript-language-server` |
| 토큰 한도 오류 | 토큰 효율적인 실행을 위해 `/oh-my-claudecode:` 접두사 사용 |

### 자동 업데이트

- 최대 24시간마다 한 번씩 확인 (속도 제한, 동시 실행 안전)
- 수동으로 업데이트하려면 플러그인 설치 명령어 재실행

### 제거

```bash
/plugin uninstall oh-my-claudecode@oh-my-claudecode
```

또는 설치된 파일 수동 제거:

```bash
rm ~/.claude/agents/{architect,document-specialist,explore,designer,writer,critic,analyst,executor,qa-tester}.md
rm ~/.claude/commands/{analyze,autopilot,deepsearch,plan,review,ultrawork}.md
```

---

## 변경 로그

버전 히스토리 및 릴리즈 노트는 [CHANGELOG.md](../CHANGELOG.md)를 참조하세요.

---

## 라이선스

MIT - [LICENSE](../LICENSE) 참조

## 크레딧

code-yeongyu의 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)에서 영감을 받았습니다.
