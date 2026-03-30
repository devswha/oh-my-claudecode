# 시작하기

> 빠른 시작 가이드: 설치부터 첫 번째 OMC 세션까지.

Oh My ClaudeCode (OMC)를 처음 사용한다면 아래 단계를 순서대로 따르세요.

1. [설치](#설치) - OMC 플러그인 설치 및 초기 설정 실행
2. [첫 번째 세션](#첫-번째-세션) - autopilot으로 첫 번째 작업 실행
3. [설정](#설정) - 프로젝트별 설정 및 에이전트 모델 사용자 정의

### 이 가이드에서 다루는 내용

- OMC 플러그인 설치 방법
- 첫 번째 autopilot 세션 실행 및 흐름 이해
- 사용자별 및 프로젝트별 설정 구성

### 사전 요구 사항

- [Claude Code](https://docs.anthropic.com/claude-code)가 설치되어 있어야 합니다
- Claude Max/Pro 구독 또는 Anthropic API 키가 필요합니다

---

## 설치

OMC는 Claude Code 플러그인으로만 설치됩니다. npm 또는 bun을 통한 직접 설치는 지원되지 않습니다.

### 1단계: 마켓플레이스 소스 추가

Claude Code 내에서 다음 명령어를 실행하세요:

```bash
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
```

### 2단계: 플러그인 설치

마켓플레이스를 추가한 후 플러그인을 설치합니다:

```bash
/plugin install oh-my-claudecode
```

### 3단계: 초기 설정 실행

설치 후 Claude Code에서 다음 중 하나를 입력합니다:

```bash
# 옵션 1: 자연어
setup omc

# 옵션 2: 스킬 명령어
/oh-my-claudecode:omc-setup
```

### 사전 요구 사항 요약

| 항목 | 요구 사항 |
|------|---------|
| Claude Code | 설치되어 있어야 함 |
| 인증 | Claude Max/Pro 구독 또는 `ANTHROPIC_API_KEY` 환경 변수 |

### 설정 범위 선택

#### 프로젝트 범위 설정 (권장)

현재 프로젝트에만 OMC를 적용합니다:

```bash
/oh-my-claudecode:omc-setup --local
```

- 설정이 `./.claude/CLAUDE.md`에 저장됩니다
- 다른 프로젝트에 영향을 주지 않습니다
- 기존 전역 `CLAUDE.md`는 유지됩니다

#### 전역 설정

모든 Claude Code 세션에 OMC를 적용합니다:

```bash
/oh-my-claudecode:omc-setup
```

- 설정이 `~/.claude/CLAUDE.md`에 저장됩니다
- 모든 프로젝트에 적용됩니다

> ⚠️ **경고:** 전역 설정은 기존 `~/.claude/CLAUDE.md` 파일을 덮어씁니다. 이미 해당 파일에 설정이 있다면 프로젝트 범위 설정(`--local`)을 사용하세요.

### 설치 확인

모든 것이 정상적으로 작동하는지 확인하려면 진단 도구를 실행합니다:

```bash
/oh-my-claudecode:omc-doctor
```

다음 항목을 검사합니다:

- 의존성 설치 상태
- 설정 파일 오류
- Hook 설치 상태
- 에이전트 가용성
- 스킬 등록 상태

### 플랫폼 지원

| 플랫폼 | 설치 방법 | Hook 유형 |
|--------|----------|---------|
| macOS | Claude Code 플러그인 | Bash (.sh) |
| Linux | Claude Code 플러그인 | Bash (.sh) |
| Windows | WSL2 권장 | Node.js (.mjs) |

> ℹ️ **참고:** 네이티브 Windows 지원은 실험적입니다. OMC는 네이티브 Windows에서 사용할 수 없는 tmux가 필요합니다. WSL2를 사용하세요.

### 업데이트

OMC는 24시간마다 자동으로 업데이트를 확인합니다. 수동으로 업데이트하려면 플러그인 설치 명령어를 재실행하세요.

> ⚠️ **경고:** 플러그인 업데이트 후 최신 설정을 적용하려면 `/oh-my-claudecode:omc-setup`을 다시 실행하세요.

### 제거

```bash
/plugin uninstall oh-my-claudecode@oh-my-claudecode
```

---

## 첫 번째 세션

OMC가 설치되면 바로 첫 번째 작업을 실행합니다. Claude Code를 열고 다음을 입력합니다:

```bash
autopilot build me a hello world app
```

이 한 줄만으로 OMC가 전체 개발 파이프라인을 자동으로 실행합니다.

### 진행 과정

OMC가 `autopilot` 매직 키워드를 감지하면 5단계 파이프라인을 시작합니다:

### 1단계: 확장

`analyst`와 `architect` 에이전트가 아이디어를 분석하고, 요구사항을 명확히 하며, 기술 명세서를 작성합니다.

### 2단계: 계획

`planner` 에이전트가 실행 계획을 수립합니다. `critic` 에이전트가 계획을 검토하고 갭을 파악합니다.

### 3단계: 실행

`executor` 에이전트가 코드를 작성합니다. 필요한 경우 여러 에이전트가 병렬로 작업합니다.

### 4단계: QA

빌드 성공 및 테스트 통과를 검증합니다. 실패 시 자동으로 수정하고 재검증합니다.

### 5단계: 검증

전문가 에이전트가 기능, 보안, 코드 품질에 대한 최종 검토를 수행합니다. 모두 통과하면 작업이 완료됩니다.

### HUD 상태 표시

작업이 진행되는 동안 Claude Code 상태 표시줄(HUD)에서 현재 상태를 모니터링할 수 있습니다:

```
[OMC] autopilot:execution | agents:3 | todos:2/5 | ctx:45%
```

| 필드 | 의미 |
|------|------|
| `autopilot:execution` | autopilot 파이프라인 내 현재 단계 |
| `agents:3` | 현재 활성 에이전트 수 |
| `todos:2/5` | 완료된 작업 / 전체 작업 수 |
| `ctx:45%` | 컨텍스트 창 사용 비율 |

HUD 표시를 설정하려면 다음을 실행합니다:

```bash
/oh-my-claudecode:hud setup
```

### 더 작게 시작하기

autopilot이 너무 크게 느껴진다면, 단일 작업 명령어로 시작하세요:

```bash
# 코드 분석
analyze why this test is failing

# 파일 검색
deepsearch for files that handle authentication

# 단순 구현
ultrawork add a health check endpoint
```

이 키워드들은 전체 파이프라인을 실행하지 않고 적절한 단일 에이전트를 직접 호출합니다.

### 다음 단계

- [설정](#설정) - 프로젝트에 맞게 에이전트 모델 및 기능 조정
- [개념](/docs/concepts) - 에이전트, 스킬, hook 간의 관계 이해

---

## 설정

OMC는 두 가지 수준의 설정 파일을 지원합니다.

| 범위 | 파일 경로 | 목적 |
|------|---------|------|
| 사용자 (전역) | `~/.config/claude-omc/config.jsonc` | 모든 프로젝트에 적용 |
| 프로젝트 | `.claude/omc.jsonc` | 현재 프로젝트에만 적용 |

> ⚠️ **경고:** 설정 파일 형식은 JSONC (주석 지원 JSON)입니다. TypeScript config 파일(`omc.config.ts`)이 아닙니다.

### 설정 우선순위

여러 소스에서 설정이 존재할 경우 다음 순서로 병합됩니다 (아래로 갈수록 우선순위 높음):

```
기본값 → 사용자 config (~/.config/claude-omc/config.jsonc)
       → 프로젝트 config (.claude/omc.jsonc)
       → 환경 변수
```

### 기본 설정 구조

```jsonc
{
  // 에이전트별 모델 할당
  "agents": {
    "explore": { "model": "haiku" },
    "executor": { "model": "sonnet" },
    "architect": { "model": "opus" }
  },

  // 기능 토글
  "features": {
    "parallelExecution": true,
    "lspTools": true,
    "astTools": true
  },

  // 매직 키워드 사용자 정의
  "magicKeywords": {
    "ultrawork": ["ultrawork", "ulw", "uw"],
    "search": ["search", "find", "locate"],
    "analyze": ["analyze", "investigate", "examine"],
    "ultrathink": ["ultrathink", "think", "reason"]
  }
}
```

### 에이전트 모델 재정의

각 에이전트가 사용하는 AI 모델을 변경할 수 있습니다:

```jsonc
{
  "agents": {
    // explore 에이전트를 더 강력한 모델로 업그레이드
    "explore": { "model": "sonnet" },

    // 복잡한 프로젝트를 위해 executor를 opus로 업그레이드
    "executor": { "model": "opus" },

    // 비용 절감: 문서 작성에 haiku 사용
    "writer": { "model": "haiku" }
  }
}
```

#### 기본 모델 매핑

| 에이전트 | 기본 모델 | 역할 |
|---------|----------|------|
| `explore` | haiku | 코드베이스 탐색 |
| `writer` | haiku | 문서 작성 |
| `executor` | sonnet | 코드 구현 |
| `debugger` | sonnet | 디버깅 |
| `designer` | sonnet | UI/UX 설계 |
| `verifier` | sonnet | 검증 |
| `tracer` | sonnet | 증거 기반 인과 추적 |
| `security-reviewer` | sonnet | 보안 취약점 및 신뢰 경계 |
| `test-engineer` | sonnet | 테스트 전략 및 커버리지 |
| `qa-tester` | sonnet | 대화형 CLI/서비스 런타임 검증 |
| `scientist` | sonnet | 데이터 및 통계 분석 |
| `git-master` | sonnet | Git 작업 및 히스토리 관리 |
| `document-specialist` | sonnet | 외부 문서 및 API 레퍼런스 조회 |
| `architect` | opus | 시스템 설계 |
| `planner` | opus | 전략적 계획 수립 |
| `critic` | opus | 계획 검토 |
| `analyst` | opus | 요구사항 분석 |
| `code-reviewer` | opus | 포괄적인 코드 리뷰 |
| `code-simplifier` | opus | 코드 명확성 및 단순화 |

### 매직 키워드 사용자 정의

`config.jsonc`의 `magicKeywords` 섹션을 통해 네 가지 카테고리의 키워드를 변경할 수 있습니다:

```jsonc
{
  "magicKeywords": {
    // 병렬 실행 모드 트리거
    "ultrawork": ["ultrawork", "ulw", "parallel"],

    // 코드베이스 검색 모드 트리거
    "search": ["search", "find", "locate", "grep"],

    // 분석 모드 트리거
    "analyze": ["analyze", "debug", "investigate"],

    // 심층 추론 모드 트리거
    "ultrathink": ["ultrathink", "think", "reason"]
  }
}
```

> ℹ️ **참고:** `config.jsonc`의 `magicKeywords` 섹션은 `ultrawork`, `search`, `analyze`, `ultrathink` 네 가지 카테고리만 사용자 정의할 수 있습니다. `autopilot`, `ralph`, `ccg`와 같은 키워드는 keyword-detector hook에 하드코딩되어 있어 config 파일로 변경할 수 없습니다.

### 모델 라우팅 설정

OMC는 작업 복잡도에 따라 자동으로 모델 티어를 선택합니다:

```jsonc
{
  "routing": {
    "enabled": true,
    "defaultTier": "MEDIUM",
    // 모든 에이전트가 부모 모델을 상속하도록 강제
    // (CC Switch, Bedrock, 또는 Vertex AI 사용 시 자동 활성화)
    "forceInherit": false
  }
}
```

| 티어 | 모델 | 사용 사례 |
|------|------|---------|
| LOW | haiku | 빠른 조회, 단순 작업 |
| MEDIUM | sonnet | 표준 구현, 일반 작업 |
| HIGH | opus | 아키텍처, 심층 분석 |

### CLAUDE.md 설정

OMC의 기본 동작은 `CLAUDE.md` 파일을 통해서도 설정됩니다. `/oh-my-claudecode:omc-setup` 실행 시 이 파일이 자동으로 생성됩니다.

| 범위 | 파일 | 설명 |
|------|------|------|
| 전역 | `~/.claude/CLAUDE.md` | 모든 프로젝트에서 공유되는 설정 |
| 프로젝트 | `.claude/CLAUDE.md` | 프로젝트별 컨텍스트 및 재정의 |

### 설정을 다시 실행해야 할 때

- 초기 설치 후
- OMC 업데이트 후 (최신 설정 적용을 위해)
- 다른 머신으로 전환할 때
- 새 프로젝트를 시작할 때 (`--local` 옵션 사용)
