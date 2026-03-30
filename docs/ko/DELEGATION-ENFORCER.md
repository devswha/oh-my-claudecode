# 위임 강제자 (Delegation Enforcer)

**Task/Agent 호출에 대한 자동 모델 파라미터 주입**

## 문제

Claude Code는 에이전트 정의에서 모델 파라미터를 자동으로 적용하지 **않습니다**. `Task` 도구(또는 `Agent` 도구)를 호출할 때 각 에이전트가 설정에 기본 모델이 정의되어 있더라도 매번 `model` 파라미터를 수동으로 지정해야 합니다.

이로 인해:
- 장황한 위임 코드
- 잊어버린 모델 파라미터가 부모 모델로 기본 설정됨
- 코드베이스 전반에 걸쳐 일관성 없는 모델 사용

## 해결책

**위임 강제자**는 명시적으로 지정되지 않은 경우 에이전트 정의를 기반으로 모델 파라미터를 자동으로 주입하는 미들웨어입니다.

## 작동 방식

### 1. Pre-Tool-Use 훅

강제자는 `Task` 및 `Agent` 도구 호출을 가로채는 pre-tool-use 훅으로 실행됩니다:

```typescript
// 강제 적용 전
Task(
  subagent_type="oh-my-claudecode:executor",
  prompt="기능 X 구현"
)

// 강제 적용 후 (자동)
Task(
  subagent_type="oh-my-claudecode:executor",
  model="sonnet",  // ← 자동 주입됨
  prompt="기능 X 구현"
)
```

### 2. 에이전트 정의 조회

각 에이전트는 정의에 기본 모델을 가지고 있습니다:

```typescript
export const executorAgent: AgentConfig = {
  name: 'executor',
  description: '...',
  prompt: '...',
  tools: [...],
  model: 'sonnet'  // ← 기본 모델
};
```

강제자는 이 정의를 읽어 모델이 지정되지 않은 경우 주입합니다.

### 3. 명시적 모델 보존

모델을 명시적으로 지정하면 항상 보존됩니다:

```typescript
// 명시적 모델은 절대 재정의되지 않음
Task(
  subagent_type="oh-my-claudecode:executor",
  model="haiku",  // ← 기본 sonnet 대신 haiku 명시적 사용
  prompt="빠른 조회"
)
```

## API

### 핵심 함수

#### `enforceModel(agentInput: AgentInput): EnforcementResult`

단일 에이전트 위임 호출에 대한 모델 파라미터 강제 적용.

```typescript
import { enforceModel } from 'oh-my-claudecode';

const input = {
  description: '기능 구현',
  prompt: '유효성 검사 추가',
  subagent_type: 'executor'
};

const result = enforceModel(input);
console.log(result.modifiedInput.model); // 'sonnet'
console.log(result.injected); // true
```

#### `getModelForAgent(agentType: string): ModelType`

에이전트 타입의 기본 모델 가져오기.

```typescript
import { getModelForAgent } from 'oh-my-claudecode';

getModelForAgent('executor'); // 'sonnet'
getModelForAgent('executor-low'); // 'haiku'
getModelForAgent('executor-high'); // 'opus'
```

#### `isAgentCall(toolName: string, toolInput: unknown): boolean`

도구 호출이 에이전트 위임 호출인지 확인.

```typescript
import { isAgentCall } from 'oh-my-claudecode';

isAgentCall('Task', { subagent_type: 'executor', ... }); // true
isAgentCall('Bash', { command: 'ls' }); // false
```

### 훅 통합

강제자는 pre-tool-use 훅과 자동으로 통합됩니다:

```typescript
import { processHook } from 'oh-my-claudecode';

const hookInput = {
  toolName: 'Task',
  toolInput: {
    description: '테스트',
    prompt: '테스트',
    subagent_type: 'executor'
  }
};

const result = await processHook('pre-tool-use', hookInput);
console.log(result.modifiedInput.model); // 'sonnet'
```

## 에이전트 모델 매핑

| 에이전트 타입 | 기본 모델 | 용도 |
|------------|---------------|----------|
| `architect` | opus | 복잡한 분석, 디버깅 |
| `architect-medium` | sonnet | 표준 분석 |
| `architect-low` | haiku | 간단한 질문 |
| `executor` | sonnet | 표준 구현 |
| `executor-high` | opus | 복잡한 리팩토링 |
| `executor-low` | haiku | 간단한 변경 |
| `explore` | haiku | 빠른 코드 검색 |
| `designer` | sonnet | UI 구현 |
| `designer-high` | opus | 복잡한 UI 아키텍처 |
| `designer-low` | haiku | 간단한 스타일링 |
| `document-specialist` | sonnet | 문서 조회 |
| `writer` | haiku | 문서 작성 |
| `planner` | opus | 전략적 계획 |
| `critic` | opus | 계획 검토 |
| `analyst` | opus | 사전 계획 분석 |
| `qa-tester` | sonnet | CLI 테스트 |
| `scientist` | sonnet | 데이터 분석 |
| `scientist-high` | opus | 복잡한 리서치 |

## 디버그 모드

모델이 자동 주입될 때 디버그 로깅을 활성화하려면:

```bash
export OMC_DEBUG=true
```

활성화되면 다음과 같은 경고를 볼 수 있습니다:

```
[OMC] Auto-injecting model: sonnet for executor
```

**중요:** 경고는 `OMC_DEBUG=true`일 때만 표시됩니다. 이 플래그 없이는 강제 적용이 자동으로(조용히) 이루어집니다.

## 사용 예시

### 이전 (수동)

```typescript
// 모든 위임에 명시적 모델 필요
Task(
  subagent_type="oh-my-claudecode:executor",
  model="sonnet",
  prompt="X 구현"
)

Task(
  subagent_type="oh-my-claudecode:executor-low",
  model="haiku",
  prompt="빠른 조회"
)
```

### 이후 (자동)

```typescript
// 정의에서 모델 자동 주입
Task(
  subagent_type="oh-my-claudecode:executor",
  prompt="X 구현"
)

Task(
  subagent_type="oh-my-claudecode:executor-low",
  prompt="빠른 조회"
)
```

### 필요시 재정의

```typescript
// 간단한 executor 작업에 haiku 사용
Task(
  subagent_type="oh-my-claudecode:executor",
  model="haiku",  // 기본 sonnet 재정의
  prompt="X의 정의 찾기"
)
```

## 구현 세부 사항

### 훅 통합

강제자는 `pre-tool-use` 훅에서 실행됩니다:

1. 훅이 도구 호출을 수신
2. 도구가 `Task` 또는 `Agent`인지 확인
3. `model` 파라미터가 누락되었는지 확인
4. 에이전트 정의 조회
5. 기본 모델 주입
6. 수정된 입력 반환

### 오류 처리

- 알 수 없는 에이전트 타입은 오류 발생
- 기본 모델이 없는 에이전트는 오류 발생
- 잘못된 입력 구조는 변경 없이 통과
- 에이전트가 아닌 도구는 무시됨

### 성능

- O(1) 조회: 에이전트 정의에 대한 직접 해시맵 조회
- 비동기 작업 없음: 동기식 강제 적용
- 최소 오버헤드: Task/Agent 호출에만 적용

## 테스트

테스트 실행:

```bash
npm test -- delegation-enforcer
```

데모 실행:

```bash
npx tsx examples/delegation-enforcer-demo.ts
```

## 장점

1. **깔끔한 코드**: 매번 수동으로 모델을 지정할 필요 없음
2. **일관성**: 항상 각 에이전트에 올바른 모델 티어 사용
3. **안전성**: 명시적 모델은 항상 보존됨
4. **투명성**: 디버그 모드에서 모델 주입 시점 표시
5. **설정 불필요**: 기존 에이전트 정의와 함께 자동으로 작동

## 마이그레이션

마이그레이션이 필요 없습니다! 강제자는 하위 호환성을 갖습니다:

- 명시적 모델이 있는 기존 코드는 계속 작동
- 새 코드에서 model 파라미터를 생략할 수 있음
- 호환성 변경 없음

## 관련 문서

- [에이전트 정의](./AGENTS.md) - 완전한 에이전트 레퍼런스
- [기능 레퍼런스](./FEATURES.md) - 모델 라우팅 및 위임 카테고리
