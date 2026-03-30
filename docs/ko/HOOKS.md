# Hooks 시스템

> OMC의 20개 hook은 Claude Code 라이프사이클 이벤트를 가로채어 매직 키워드, 컨텍스트 주입, 품질 강제를 가능하게 합니다.

## Hook이란?

Hook은 Claude Code 라이프사이클 이벤트에 반응하여 자동으로 실행되는 스크립트입니다. oh-my-claudecode는 20개의 hook으로 Claude Code의 기본 동작을 확장합니다.

사용자가 프롬프트를 제출하거나, 도구가 실행되거나, 세션이 시작/종료될 때 hook이 자동으로 발동하여 추가 컨텍스트를 주입하고, 모드를 활성화하며, 상태를 관리합니다.

## Hook 동작 방식

Hook은 `hooks.json` 파일에 정의됩니다. 각 hook은 다음 구조를 따릅니다:

```json
{
  "EventName": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node scripts/hook-script.mjs",
          "timeout": 5
        }
      ]
    }
  ]
}
```

- **EventName**: hook이 반응하는 라이프사이클 이벤트
- **matcher**: hook 실행 조건 (`*`는 모든 경우에 매칭)
- **command**: 실행할 Node.js 스크립트
- **timeout**: 최대 실행 시간 (초)

Hook 출력은 `<system-reminder>` 태그를 통해 Claude에 주입됩니다. 추가 컨텍스트는 `hookSpecificOutput.additionalContext`를 통해 전달됩니다.

## Hook 카테고리

OMC hook은 네 가지 카테고리로 나뉩니다:

### 실행 모드 Hook

자율 운영, 병렬 처리, 지속성을 포함한 실행 모드를 관리합니다.

| Hook | 설명 |
|------|------|
| autopilot | 아이디어부터 동작하는 코드까지 완전 자율 실행 |
| ralph | 검증이 완료될 때까지 지속 실행 |
| ultrawork | 최대 병렬 에이전트 실행 |
| ultraqa | 목표 달성까지 반복 QA 사이클 |
| persistent-mode | 세션 전반에 걸쳐 모드 상태 보존 |

### 핵심 Hook

오케스트레이션, 키워드 감지, 복구를 처리합니다.

| Hook | 설명 |
|------|------|
| keyword-detector | 매직 키워드 감지 (ultrawork, ralph 등) |

### 컨텍스트 관리 Hook

메모리, 프로젝트 상태, 압축을 관리합니다.

| Hook | 설명 |
|------|------|
| notepad | 압축에 강한 메모리 시스템 |
| project-memory | 프로젝트 수준 메모리 관리 |
| pre-compact | 압축 전 상태 처리 |

### 품질/검증 Hook

코드 품질, 권한, 서브에이전트 추적을 처리합니다.

| Hook | 설명 |
|------|------|
| permission-handler | 권한 요청 처리 및 검증 |
| subagent-tracker | 서브에이전트 실행 및 완료 추적 |
| code-simplifier | Stop 시 최근 수정된 파일 자동 단순화 (옵트인) |

## Hooks 비활성화

### 모든 Hook 비활성화

```bash
export DISABLE_OMC=1
```

### 특정 Hook 비활성화

```bash
export OMC_SKIP_HOOKS="keyword-detector,notepad"
```

쉼표로 hook 이름을 구분하여 해당 hook만 건너뜁니다.

---

## 라이프사이클 이벤트

Claude Code는 세션 전반에 걸쳐 이벤트를 발생시킵니다. OMC는 이 이벤트에 hook을 연결하여 동작을 확장합니다. 총 11개의 라이프사이클 이벤트가 있습니다.

### UserPromptSubmit

사용자가 프롬프트를 제출할 때 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `keyword-detector.mjs` | 매직 키워드를 감지하고 해당 스킬을 호출 | 5초 |
| `skill-injector.mjs` | 스킬 프롬프트 주입 | 3초 |

모든 사용자 입력에서 실행됩니다 (`matcher: "*"`). keyword detector가 "ultrawork", "ralph", "autopilot" 같은 키워드를 찾으면 `additionalContext`를 통해 해당 스킬 호출 지시를 주입합니다.

### SessionStart

새 세션이 시작될 때 발동합니다.

| 스크립트 | Matcher | 역할 | 타임아웃 |
|---------|---------|------|---------|
| `session-start.mjs` | `*` | 세션 초기화, 상태 복원 | 5초 |
| `project-memory-session.mjs` | `*` | 프로젝트 메모리 로드 | 5초 |
| `setup-init.mjs` | `init` | 초기 설정 마법사 | 30초 |
| `setup-maintenance.mjs` | `maintenance` | 유지보수 작업 | 60초 |

`init` 및 `maintenance` matcher는 특수한 경우에만 실행됩니다. 일반 세션 시작에서는 `*` matcher 스크립트 두 개만 실행됩니다.

### PreToolUse

Claude가 도구를 사용하기 직전에 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `pre-tool-enforcer.mjs` | 도구 사용 전 규칙 검증 | 3초 |

모든 도구 호출에서 실행됩니다 (`matcher: "*"`). 에이전트 권한 제한을 강제합니다 (예: 읽기 전용 에이전트의 Write/Edit 차단).

### PermissionRequest

Bash 도구 실행 중 권한 요청이 발생할 때 발동합니다.

| 스크립트 | Matcher | 역할 | 타임아웃 |
|---------|---------|------|---------|
| `permission-handler.mjs` | `Bash` | Bash 명령어 권한 처리 | 5초 |

Bash 도구에 대한 권한 요청만 처리합니다.

### PostToolUse

도구 사용이 완료된 후 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `post-tool-verifier.mjs` | 도구 결과 검증 및 추가 컨텍스트 주입 | 3초 |
| `project-memory-posttool.mjs` | 프로젝트 메모리 업데이트 | 3초 |

Read, Write, Edit, Bash 결과에 따라 추가 가이드를 주입합니다. 예를 들어 파일을 읽은 후 "병렬 읽기 사용을 고려하세요"라고 힌트를 줄 수 있습니다.

### PostToolUseFailure

도구 사용이 실패했을 때 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `post-tool-use-failure.mjs` | 실패한 도구 사용에 대한 복구 가이드 제공 | 3초 |

### SubagentStart

서브에이전트가 실행될 때 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `subagent-tracker.mjs start` | 서브에이전트 시작 추적, 프롬프트 주입 | 3초 |

서브에이전트 이름, 시작 시간, 세션 정보를 기록합니다.

### SubagentStop

서브에이전트가 완료될 때 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `subagent-tracker.mjs stop` | 서브에이전트 완료 추적 | 5초 |
| `verify-deliverables.mjs` | 서브에이전트 결과물 검증 | 5초 |

### PreCompact

컨텍스트 압축이 일어나기 직전에 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `pre-compact.mjs` | 압축 전 상태 보존 | 10초 |
| `project-memory-precompact.mjs` | 프로젝트 메모리 보존 | 5초 |

컨텍스트 창이 가득 차서 압축이 실행되기 전에 중요한 상태와 메모리를 저장합니다.

### Stop

Claude가 응답을 마칠 때 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `context-guard-stop.mjs` | 컨텍스트 사용량 모니터링 | 5초 |
| `persistent-mode.cjs` | 활성 모드 상태 유지 (ralph, ultrawork 등) | 10초 |
| `code-simplifier.mjs` | 수정된 파일 자동 단순화 (옵트인) | 5초 |

`persistent-mode`는 활성 실행 모드가 실행 중일 때 "The boulder never stops"와 같은 강화 메시지를 주입하여 작업을 계속하도록 유도합니다.

### SessionEnd

세션이 종료될 때 발동합니다.

| 스크립트 | 역할 | 타임아웃 |
|---------|------|---------|
| `session-end.mjs` | 세션 요약 저장, 콜백 알림 전송 | 10초 |

에이전트 활동, 토큰 사용량 및 기타 세션 데이터를 `.omc/sessions/`에 저장합니다. 설정된 경우 Discord, Telegram, Slack을 통해 완료 알림을 전송합니다.

---

## 핵심 Hooks

### 실행 모드 Hooks

이 hook들은 `.omc/state/{mode}-state.json`의 상태 파일을 사용하여 OMC의 핵심 실행 모드를 관리합니다.

#### autopilot

아이디어부터 동작하는 코드까지 완전 자율 실행.

- **활성화**: 키워드: "autopilot", "build me", "I want a"
- **동작**: 전체 사이클 자동 실행: 계획 → 구현 → 테스트 → 검증
- **상태 파일**: `.omc/state/autopilot-state.json`

#### ralph

검증이 완료될 때까지 계속 실행되는 지속 실행 모드.

- **활성화**: 키워드: "ralph", "don't stop", "must complete"
- **동작**: 모든 작업이 완료되고 검증될 때까지 멈추지 않음
- **특징**: ultrawork를 자동으로 포함. team과 연결 가능 (`team ralph`)
- **상태 파일**: `.omc/state/ralph-state.json`
- **강화 메시지**: "The boulder never stops" — Stop hook이 주입하여 작업 계속을 독려

#### ultrawork

최대 병렬성으로 여러 에이전트를 동시에 실행.

- **활성화**: 키워드: "ultrawork", "ulw"
- **동작**: 독립적인 작업을 여러 에이전트에 병렬로 위임
- **상태 파일**: `.omc/state/ultrawork-state.json`

#### ultraqa

목표가 달성될 때까지 QA 사이클을 반복.

- **활성화**: autopilot 내에서 자동 실행
- **동작**: 테스트 → 검증 → 수정 → 반복
- **관련 스킬**: `/oh-my-claudecode:ultraqa`

### 오케스트레이션 Hooks

#### keyword-detector

사용자 프롬프트에서 매직 키워드를 감지하고 해당 스킬을 호출합니다.

- **이벤트**: UserPromptSubmit
- **동작**: 프롬프트를 정제(코드 블록, URL, 파일 경로 제거)한 후 키워드 패턴과 매칭
- **충돌 해결**: cancel이 최우선, 그 다음 ralph > autopilot > ultrawork
- **안전장치**: 무한 실행 방지를 위해 team 워커 내에서는 비활성화

전체 키워드 목록은 [매직 키워드](#매직-키워드) 섹션을 참조하세요.

#### persistent-mode

세션 전반에 걸쳐 활성 실행 모드 상태를 유지합니다.

- **이벤트**: Stop
- **동작**: 활성 모드(ralph, ultrawork, autopilot 등)가 있을 때 강화 메시지 주입
- **메시지**: 미완료 작업이 남아 있을 때 작업 계속을 독려
- **취소**: 모드 비활성화는 `/oh-my-claudecode:cancel` 사용

### 모드 상태 관리

실행 모드 hook은 `.omc/state/` 디렉토리의 상태 파일을 관리합니다.

```json
{
  "active": true,
  "started_at": "2025-01-15T10:30:00Z",
  "original_prompt": "ultrawork implement auth",
  "session_id": "abc123",
  "project_path": "/path/to/project",
  "reinforcement_count": 0,
  "last_checked_at": "2025-01-15T10:30:00Z"
}
```

세션 ID가 있는 경우 상태는 `.omc/state/sessions/{sessionId}/` 아래의 세션 범위에 저장됩니다.

#### 모드 취소

```
cancelomc
```

또는

```
/oh-my-claudecode:cancel
```

`cancel`은 ralph, autopilot, ultrawork 등 모든 활성 모드의 상태 파일을 제거합니다.

---

## 컨텍스트 관리 Hooks

Claude Code의 컨텍스트 창은 유한합니다. 긴 세션에서는 압축이 발생하고 이전 대화 내용이 요약됩니다. OMC의 컨텍스트 관리 hook은 압축을 준비하고, 중요한 정보를 보존하며, 프로젝트 수준의 메모리를 유지합니다.

### notepad

압축에 강한 메모리 시스템.

- **저장 경로**: `.omc/notepad.md`
- **MCP 도구**: `notepad_read`, `notepad_write_priority`, `notepad_write_working`, `notepad_write_manual`
- **동작**: 노트패드에 저장된 정보는 압축 후에도 유지됨

노트패드는 세 가지 우선순위를 지원합니다:

| 우선순위 | 도구 | 설명 |
|---------|------|------|
| Priority | `notepad_write_priority` | 절대 잃어서는 안 되는 정보 |
| Working | `notepad_write_working` | 현재 진행 중인 작업 상태 |
| Manual | `notepad_write_manual` | 수동으로 기록된 메모 |

오래된 항목 정리는 `notepad_prune`, 상태 확인은 `notepad_stats`를 사용합니다.

### project-memory

영구적인 프로젝트 수준 메모리를 관리합니다.

- **저장 경로**: `.omc/project-memory.json`
- **MCP 도구**: `project_memory_read`, `project_memory_write`, `project_memory_add_note`, `project_memory_add_directive`
- **관련 hook**:
  - `project-memory-session.mjs` (SessionStart): 세션 시작 시 프로젝트 메모리 로드
  - `project-memory-posttool.mjs` (PostToolUse): 도구 사용 후 메모리 업데이트
  - `project-memory-precompact.mjs` (PreCompact): 압축 전 메모리 보존

project-memory에는 두 종류의 데이터가 저장됩니다:

- **노트**: 프로젝트에 대해 학습된 사실 (아키텍처 패턴, 버그 히스토리 등)
- **지시사항**: 프로젝트 작업 시 따라야 할 지시

### pre-compact

압축이 일어나기 직전에 중요한 상태를 보존합니다.

- **이벤트**: PreCompact
- **동작**: 현재 작업 상태, 진행 중인 TODO, 중요한 컨텍스트를 요약하고 보존
- **목적**: 압축 후에도 작업을 재개할 수 있도록 필수 정보 유지

### 컨텍스트 보존 전략

OMC의 컨텍스트 관리 hook은 다음 전략으로 협력합니다:

```
세션 시작
  → project-memory 로드
    → [작업 진행]
    → 중요 정보를 notepad에 저장
    → project-memory 업데이트
      → [압축 발동]
      → pre-compact가 상태 보존
      → project-memory 보존
        → [압축 후]
        → notepad / project-memory를 통해 복원
```

---

## 매직 키워드

매직 키워드는 사용자의 자연어 프롬프트에서 특정 단어나 패턴이 감지될 때 OMC 스킬이나 실행 모드를 자동으로 활성화합니다. 슬래시 명령어가 필요 없습니다 — 프롬프트에 키워드를 포함하면 기능이 자동으로 활성화됩니다.

### keyword-detector 동작 방식

`keyword-detector.mjs`는 UserPromptSubmit 이벤트에서 실행됩니다.

1. 사용자 프롬프트를 수신하고 정제
2. 오탐 방지를 위해 코드 블록, XML 태그, URL, 파일 경로 제거
3. 정제된 텍스트에 키워드 패턴 매칭
4. 충돌 해결 후 스킬 호출 지시 주입

**안전 장치:**

- **정제**: 코드 블록, URL, 파일 경로 내의 키워드는 무시
- **team 워커 보호**: `OMC_TEAM_WORKER` 환경 변수가 설정된 경우 비활성화 (무한 실행 방지)
- **비활성화**: `DISABLE_OMC=1` 또는 `OMC_SKIP_HOOKS=keyword-detector` 설정

### 실행 모드 키워드

이 키워드들은 스킬을 호출하고 상태 파일을 생성합니다.

| 키워드 | 스킬 | 설명 |
|--------|------|------|
| `cancelomc`, `stopomc` | cancel | 모든 활성 모드 취소 |
| `ralph`, `don't stop`, `must complete`, `until done` | ralph | 검증 완료까지 지속 실행 |
| `autopilot`, `build me`, `I want a`, `handle it all`, `end to end`, `auto-pilot`, `full auto`, `fullsend`, `e2e this` | autopilot | 완전 자율 실행 |
| `ultrawork`, `ulw`, `uw` | ultrawork | 최대 병렬 실행 |
| `ccg`, `claude-codex-gemini` | ccg | Claude-Codex-Gemini 3-모델 오케스트레이션 |
| `ralplan` | ralplan | 합의 기반 반복 계획 수립 |
| `deep interview`, `ouroboros` | deep-interview | 소크라테스식 심층 인터뷰 |

### AI Slop 정리 키워드

두 가지 패턴 유형을 지원합니다:

**명시적 패턴** (단독으로 활성화):

- `ai-slop`, `anti-slop`, `deslop`, `de-slop`

**조합 패턴** (액션 키워드와 감지 키워드의 조합으로 활성화):

| 액션 키워드 | 감지 키워드 |
|-----------|-----------|
| `cleanup`, `refactor`, `simplify`, `dedupe`, `prune` | `slop`, `duplicate`, `dead code`, `unused code`, `over-abstraction`, `wrapper layers`, `needless abstractions`, `ai-generated`, `tech debt` |

예시: "cleanup the duplicate code" → ai-slop-cleaner 스킬 활성화.

### 에이전트 단축키 키워드

슬래시 명령어 대신 자연어로 에이전트를 활성화합니다.

| 키워드 | 효과 | 동작 |
|--------|------|------|
| `tdd`, `test first`, `red green` | TDD 모드 | 테스트 우선 작성 강제 |
| `code review`, `review code` | 코드 리뷰 모드 | 포괄적인 코드 리뷰 실행 |
| `security review`, `review security` | 보안 리뷰 모드 | 보안 집중 리뷰 실행 |

이 키워드들은 스킬을 호출하는 대신 인라인 모드 메시지를 주입합니다.

### 추론 향상 키워드

| 키워드 | 효과 |
|--------|------|
| `ultrathink`, `think hard`, `think deeply` | 확장 추론 모드 활성화 |
| `deepsearch`, `search the codebase`, `find in codebase` | 코드베이스 집중 검색 모드 활성화 |
| `deep-analyze`, `deepanalyze` | 심층 분석 모드 활성화 |

### 우선순위 및 충돌 해결

여러 키워드가 동시에 감지될 경우 다음 우선순위로 해결됩니다:

```
cancel  (최우선, 독점적)
  → ralph
    → autopilot
      → ultrawork
        → ccg
          → ralplan
            → deep-interview
              → ai-slop-cleaner
                → tdd
                  → code-review
                    → security-review
                      → ultrathink
                        → deepsearch
                          → analyze
```

`cancel`은 독점적입니다 — 다른 모든 매칭을 무시하고 취소 동작만 실행합니다. 다른 키워드들은 함께 매칭될 수 있으며 우선순위 순으로 처리됩니다.

### 사용 예시

```bash
# Claude Code에서:

# 자율 실행
autopilot: implement user authentication with OAuth

# 병렬 실행
ultrawork write all tests for this module

# 지속 실행
ralph refactor this authentication module

# TDD
implement password validation with tdd

# 코드 리뷰
code review the recent changes

# 취소
stopomc
```

### `team` 키워드 참고

`team`은 자동 감지되지 않습니다. 무한 실행 방지를 위해 `/team` 슬래시 명령어로 명시적으로 호출해야 합니다.

```
/oh-my-claudecode:team 3:executor "build a fullstack todo app"
```
