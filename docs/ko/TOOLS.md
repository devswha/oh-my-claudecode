# MCP 도구

> OMC는 상태 관리, 코드 인텔리전스, 데이터 분석을 위한 MCP 도구를 제공합니다.

사용자가 직접 호출하는 [스킬](../docs/SKILLS.md)과 달리, 도구는 에이전트가 작업 실행 중 내부적으로 사용합니다.

## 도구 카테고리

- [상태](#상태) — 실행 모드 상태 관리
- [노트패드](#노트패드) — 컨텍스트 압축에서 살아남는 영구 메모
- [프로젝트 메모리](#프로젝트-메모리) — 세션 전반에 걸친 프로젝트별 장기 메모리
- [LSP](#lsp) — Language Server Protocol 코드 인텔리전스 (12개 도구)
- [AST Grep](#ast-grep) — AST 기반 구조적 코드 검색 및 교체
- [Python REPL](#python-repl) — 영구 Python 실행 환경

---

## 상태

상태 도구는 OMC 실행 모드(autopilot, ralph, ultrawork 등)의 상태를 관리합니다. 각 모드는 현재 진행 상황, 활성 상태, 설정을 상태 파일에 기록합니다.

### 저장 경로

```
.omc/state/
├── sessions/{sessionId}/     # 세션 범위 상태
│   ├── autopilot-state.json
│   ├── ralph-state.json
│   └── ultrawork-state.json
├── autopilot-state.json      # 레거시 폴백
├── ralph-state.json
└── ultrawork-state.json
```

세션 ID가 제공되면 세션 범위 경로를 사용하고, 그렇지 않으면 레거시 경로를 폴백으로 사용합니다.

### 도구

#### `state_read`

지정된 모드의 상태를 읽습니다.

```
state_read(mode="ralph")
state_read(mode="ralph", session_id="abc123")
```

상태 파일이 없으면 빈 응답을 반환합니다.

#### `state_write`

지정된 모드의 상태를 저장합니다.

```
state_write(mode="ralph", state={
  active: true,
  current_phase: "execution",
  iteration: 3,
  max_iterations: 10
})
```

#### `state_clear`

지정된 모드의 상태 파일을 삭제합니다.

```
state_clear(mode="ralph")
state_clear(mode="ralph", session_id="abc123")
```

세션 ID 없이 호출하면 레거시 파일을 삭제합니다.

#### `state_list_active`

현재 활성화된 모든 세션을 나열합니다.

```
state_list_active()
```

`.omc/state/sessions/` 아래의 모든 세션 ID와 해당 모드를 반환합니다.

#### `state_get_status`

특정 세션의 상태 요약을 반환합니다.

```
state_get_status(session_id="abc123")
```

활성 모드 이름과 종속 모드 존재 여부를 포함합니다.

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OMC_STATE_DIR` | (미설정) | 중앙집중식 상태 디렉토리. 설정 시 worktree가 삭제되어도 상태가 유지됩니다. |

`OMC_STATE_DIR`이 설정된 경우 상태는 `$OMC_STATE_DIR/{project-id}/`에 저장됩니다.

```bash
export OMC_STATE_DIR="$HOME/.claude/omc"
```

### 사용 패턴

**모드 활성화:**

```
state_write(mode="autopilot", state={
  active: true,
  current_phase: "expansion",
  started_at: "2024-01-15T09:00:00Z"
})
```

**모드 비활성화:**

```
state_clear(mode="autopilot")
```

**활성 모드 확인:**

```
state_list_active()
→ [{session_id: "abc123", mode: "ralph", active: true}]
```

---

## 노트패드

노트패드는 컨텍스트 창 압축에서 살아남는 영구 메모 시스템입니다. 긴 세션에서 대화 초반의 중요한 정보가 컨텍스트 밖으로 밀려날 때, 노트패드에 저장된 메모는 압축 후 복원됩니다.

### 저장 경로

```
.omc/notepad.md
```

### 도구

#### `notepad_read`

노트패드의 전체 내용을 읽습니다.

```
notepad_read()
```

#### `notepad_write_priority`

최우선 순위로 메모를 저장합니다. 압축 시 가장 먼저 복원됩니다.

```
notepad_write_priority(content="이 프로젝트는 TypeScript strict 모드를 사용합니다")
```

아키텍처 결정, 중요한 제약 조건, 절대 잊어서는 안 되는 정보에 사용합니다.

#### `notepad_write_working`

현재 작업 컨텍스트를 저장합니다. 범용 메모입니다.

```
notepad_write_working(content="현재 auth 모듈 리팩토링 중, 5개 파일 중 3개 완료")
```

진행 상황 추적, 다음 단계, 작업 중 발견된 정보에 사용합니다.

#### `notepad_write_manual`

특정 위치에 수동으로 메모를 저장합니다.

```
notepad_write_manual(content="버그: session.ts:45에서 sessionId가 undefined")
```

#### `notepad_prune`

오래되거나 불필요한 메모를 정리합니다.

```
notepad_prune()
```

#### `notepad_stats`

노트패드 통계(항목 수, 크기 등)를 반환합니다.

```
notepad_stats()
```

### 사용 패턴

**중요한 결정 기록:**

```
notepad_write_priority(content="DB 마이그레이션: PostgreSQL → MySQL 금지. 기존 쿼리 호환성 문제.")
```

**작업 진행 상황 추적:**

```
notepad_write_working(content="TODO: 1. auth 모듈 수정 ✓  2. 테스트 추가  3. 문서 업데이트")
```

**세션 재개 시 컨텍스트 복원:**

```
notepad_read()
→ "현재 auth 리팩토링 중. src/auth/login.ts 완료. 다음: src/auth/session.ts"
```

### 압축 동작

Claude Code가 컨텍스트를 압축할 때:

1. 노트패드 내용이 압축 결과에 포함됩니다
2. Priority 메모가 먼저 복원됩니다
3. Working 메모가 다음으로 복원됩니다
4. 정리된 메모는 제외됩니다

매우 긴 세션에서도 핵심 컨텍스트가 보존됩니다.

---

## 프로젝트 메모리

프로젝트 메모리는 프로젝트별 장기 메모리를 관리합니다. 프로젝트 구조, 규칙, 학습된 지식, 지시사항을 세션 전반에 걸쳐 저장하여 에이전트가 프로젝트 컨텍스트를 빠르게 이해할 수 있게 합니다.

### 저장 경로

```
.omc/project-memory.json
```

### 도구

#### `project_memory_read`

프로젝트 메모리의 전체 내용을 읽습니다.

```
project_memory_read()
```

프로젝트의 모든 저장된 노트와 지시사항을 반환합니다.

#### `project_memory_write`

프로젝트 메모리 전체를 덮어씁니다.

```
project_memory_write(content={
  notes: ["TypeScript strict 모드 사용", "테스트는 vitest 사용"],
  directives: ["모든 함수에 JSDoc 필수"]
})
```

> **경고:** 기존 내용을 완전히 대체합니다. 부분 업데이트는 `project_memory_add_note` 또는 `project_memory_add_directive`를 사용하세요.

#### `project_memory_add_note`

프로젝트에 대한 노트를 추가합니다.

```
project_memory_add_note(note="src/utils/는 순수 함수만 포함해야 합니다")
```

프로젝트 구조, 패턴, 학습된 지식에 사용합니다.

#### `project_memory_add_directive`

에이전트가 따라야 할 지시사항을 추가합니다.

```
project_memory_add_directive(directive="console.log 대신 구조화된 로깅 사용")
```

코딩 규칙, 금지 사항, 요구 사항에 사용합니다.

### 노트 vs 지시사항

| | 노트 | 지시사항 |
|---|---|---|
| 성격 | 정보, 관찰, 학습된 지식 | 규칙, 제약, 요구 사항 |
| 예시 | "이 프로젝트는 모노레포 구조를 사용합니다" | "테스트 없이 PR 금지" |
| 에이전트 동작 | 결정의 참고 자료로 사용 | 반드시 엄격히 따름 |

### 노트패드 vs 프로젝트 메모리

| | 노트패드 | 프로젝트 메모리 |
|---|---|---|
| 범위 | 현재 세션 | 전체 프로젝트 (세션 전반 유지) |
| 목적 | 진행 중인 메모 | 프로젝트 규칙, 구조, 학습된 지식 |
| 파일 | `.omc/notepad.md` | `.omc/project-memory.json` |
| 압축 | 압축 시 복원 | 항상 사용 가능 |

### 사용 패턴

**프로젝트 규칙 등록:**

```
project_memory_add_directive("이 저장소는 conventional commits를 사용합니다")
project_memory_add_directive("src/generated/ 아래의 파일은 수동으로 편집하지 마세요")
```

**코드베이스 구조 기록:**

```
project_memory_add_note("API 레이어: src/api/ → src/services/ → src/repositories/")
project_memory_add_note("인증: JWT + passport.js, src/auth/에 구현됨")
```

**학습된 지식 기록:**

```
project_memory_add_note("tsconfig paths 설정은 jest.config와 동기화 유지 필요")
```

---

## LSP

LSP 도구는 Language Server Protocol 기반 코드 인텔리전스를 제공합니다: 타입 정보, 정의로 이동, 참조 찾기, 오류 진단, 심볼 검색, 이름 변경.

언어 서버가 설치되어 있어야 합니다 (예: `typescript-language-server`, `pylsp`, `rust-analyzer`, `gopls`). 설치 상태 확인은 `lsp_servers()` 사용.

### 도구

#### `lsp_hover`

지정된 위치의 타입 정보와 문서를 반환합니다.

```
lsp_hover(file="src/auth.ts", line=42, character=10)
```

#### `lsp_goto_definition`

심볼의 정의로 이동합니다.

```
lsp_goto_definition(file="src/auth.ts", line=42, character=10)
```

#### `lsp_find_references`

심볼의 모든 사용 위치를 찾습니다.

```
lsp_find_references(file="src/auth.ts", line=42, character=10)
```

#### `lsp_document_symbols`

파일의 구조적 아웃라인(함수, 클래스, 인터페이스 등)을 반환합니다.

```
lsp_document_symbols(file="src/auth.ts")
```

#### `lsp_workspace_symbols`

전체 워크스페이스에서 심볼을 검색합니다.

```
lsp_workspace_symbols(query="UserConfig")
```

#### `lsp_diagnostics`

파일의 오류, 경고, 힌트를 반환합니다.

```
lsp_diagnostics(file="src/auth.ts")
```

코드 변경 후 즉시 타입 오류를 확인하는 데 유용합니다.

#### `lsp_diagnostics_directory`

디렉토리 또는 프로젝트 전체의 진단을 반환합니다.

```
lsp_diagnostics_directory(path="src/")
```

복잡한 다중 파일 변경 후 프로젝트 전체의 타입 오류를 확인할 때 사용합니다.

#### `lsp_prepare_rename`

지정된 위치에서 이름 변경 작업이 유효한지 확인합니다.

```
lsp_prepare_rename(file="src/auth.ts", line=42, character=10)
```

#### `lsp_rename`

프로젝트 전체에서 심볼의 이름을 변경합니다.

```
lsp_rename(file="src/auth.ts", line=42, character=10, newName="AuthService")
```

#### `lsp_code_actions`

범위에 대해 사용 가능한 리팩토링 액션을 반환합니다.

```
lsp_code_actions(file="src/auth.ts", startLine=40, endLine=50)
```

#### `lsp_code_action_resolve`

특정 코드 액션의 세부 정보를 반환합니다.

```
lsp_code_action_resolve(action=<action_object>)
```

#### `lsp_servers`

사용 가능한 언어 서버와 설치 상태 목록을 반환합니다.

```
lsp_servers()
```

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OMC_LSP_TIMEOUT_MS` | `15000` | LSP 요청 타임아웃 (ms). 대규모 저장소나 느린 서버의 경우 늘리세요. |

### 문제 해결

| 문제 | 해결 방법 |
|------|---------|
| LSP 도구가 작동하지 않음 | 언어 서버 설치: `npm install -g typescript-language-server` |
| 타임아웃 오류 | `OMC_LSP_TIMEOUT_MS` 값 증가 |
| 서버 상태 확인 | `lsp_servers()` 실행하여 설치 확인 |

---

## AST Grep

AST Grep 도구는 [@ast-grep/napi](https://ast-grep.github.io/)를 사용하여 구조적 코드 패턴을 검색하고 교체합니다. 정규식이 아닌 AST(추상 구문 트리)로 동작하기 때문에 코드 구조를 정확하게 매칭합니다.

### 도구

#### `ast_grep_search`

AST 패턴을 사용하여 코드를 검색합니다.

```
ast_grep_search(
  pattern="console.log($$$ARGS)",
  lang="typescript"
)
```

**메타 변수:**

| 메타 변수 | 설명 | 예시 |
|---------|------|------|
| `$VAR` | 단일 AST 노드와 매칭 | `$VAR.map($FUNC)` |
| `$$$` | 여러 AST 노드와 매칭 | `console.log($$$ARGS)` |

**예시:**

```
# 모든 console.log 호출 찾기
ast_grep_search(pattern="console.log($$$)", lang="typescript")

# 특정 fetch 호출 패턴 찾기
ast_grep_search(pattern="fetch($URL, { method: 'POST', $$$REST })", lang="typescript")

# React useState 사용 찾기
ast_grep_search(pattern="const [$STATE, $SETTER] = useState($INIT)", lang="tsx")

# try-catch 블록 찾기
ast_grep_search(pattern="try { $$$ } catch($ERR) { $$$ }", lang="typescript")
```

#### `ast_grep_replace`

구조적 AST 패턴을 사용하여 코드를 교체합니다.

```
ast_grep_replace(
  pattern="console.log($$$ARGS)",
  replacement="logger.info($$$ARGS)",
  lang="typescript",
  dryRun=true
)
```

> **적용하기 전에 항상 `dryRun=true`로 먼저 실행하여 변경 사항을 검토하세요.**

**예시:**

```
# console.log를 logger.info로 교체
ast_grep_replace(
  pattern="console.log($$$ARGS)",
  replacement="logger.info($$$ARGS)",
  lang="typescript",
  dryRun=true
)

# 동기 함수를 async로 변환
ast_grep_replace(
  pattern="function $NAME($$$PARAMS) { $$$BODY }",
  replacement="async function $NAME($$$PARAMS) { $$$BODY }",
  lang="typescript",
  dryRun=true
)
```

### AST Grep vs Regex

| | Regex (Grep) | AST Grep |
|---|---|---|
| 매칭 대상 | 텍스트 패턴 | 코드 구조 |
| 공백/줄바꿈 | 민감함 | 무관함 |
| 주석 | 매칭됨 | 건너뜀 |
| 리팩토링 안전성 | 위험 | 구조 보존 |
| 사용 사례 | 텍스트 검색 | 코드 변환 |

### 지원 언어

TypeScript, JavaScript, TSX, JSX, Python, Go, Rust, Java, C, C++, C#, Ruby, Swift, Kotlin 및 대부분의 주요 프로그래밍 언어.

---

## Python REPL

Python REPL은 세션 내 호출 간에 상태가 유지되는 Python 실행 환경입니다. 데이터 분석, 통계 계산, 시각화, 프로토타이핑에 사용됩니다.

### 도구

#### `python_repl`

Python 코드를 실행하고 결과를 반환합니다.

```
python_repl(code="import json; data = json.loads('{\"key\": \"value\"}'); print(data)")
```

### 특징

**영구 상태:** 한 번의 호출에서 정의된 변수, 함수, import는 이후 호출에서도 사용 가능합니다.

```python
# 첫 번째 호출
python_repl(code="import pandas as pd; df = pd.read_csv('data.csv')")

# 두 번째 호출 (df가 여전히 사용 가능)
python_repl(code="print(df.describe())")
```

**데이터 분석:**

```python
python_repl(code="""
import json
with open('.omc/research/session-1/state.json') as f:
    state = json.load(f)
print(f"단계 수: {len(state['stages'])}")
print(f"상태: {state['status']}")
""")
```

**계산 및 변환:**

```python
python_repl(code="""
# 토큰 비용 추정
input_tokens = 150000
output_tokens = 50000
cost = (input_tokens * 0.003 + output_tokens * 0.015) / 1000
print(f"예상 비용: ${cost:.4f}")
""")
```

**파일 처리:**

```python
python_repl(code="""
import os

# 프로젝트 파일 통계
extensions = {}
for root, dirs, files in os.walk('src'):
    for f in files:
        ext = os.path.splitext(f)[1]
        extensions[ext] = extensions.get(ext, 0) + 1

for ext, count in sorted(extensions.items(), key=lambda x: -x[1]):
    print(f"{ext}: {count}개 파일")
""")
```

### 사용 사례

| 사용 사례 | 설명 |
|---------|------|
| 데이터 분석 | CSV/JSON 파일 분석, 통계 계산 |
| 프로토타이핑 | 알고리즘 검증, 로직 테스트 |
| 파일 처리 | 파일 변환, 일괄 처리 |
| 시각화 | matplotlib 또는 plotly로 차트 생성 |
| 계산 | 수학 계산, 비용 추정 |

### scientist 에이전트와의 통합

`scientist` 에이전트는 데이터 분석 작업에 `python_repl`을 사용합니다. [SciOMC](../docs/skills/workflow/sciomc.md) 연구 워크플로우에서 통계 분석과 시각화에 활용됩니다.
