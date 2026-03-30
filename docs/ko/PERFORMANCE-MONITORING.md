# 성능 모니터링 가이드

Claude Code와 oh-my-claudecode 성능을 모니터링, 디버깅, 최적화하기 위한 종합 가이드입니다.

---

## 목차

- [개요](#개요)
- [내장 모니터링](#내장-모니터링)
  - [에이전트 관측소](#에이전트-관측소)
  - [세션 종료 요약](#세션-종료-요약)
  - [세션 리플레이](#세션-리플레이)
- [HUD 통합](#hud-통합)
- [디버깅 기법](#디버깅-기법)
- [외부 리소스](#외부-리소스)
- [모범 사례](#모범-사례)
- [문제 해결](#문제-해결)

---

## 개요

oh-my-claudecode는 에이전트 성능, 토큰 사용량, 비용 추적, 멀티 에이전트 워크플로우의 병목 현상 식별을 위한 종합적인 모니터링 기능을 제공합니다. 이 가이드는 Claude 성능 모니터링을 위한 내장 도구와 외부 리소스를 모두 다룹니다.

### 모니터링 가능한 항목

| 지표 | 도구 | 세분성 |
|--------|------|-------------|
| 에이전트 생명주기 | 에이전트 관측소 | 에이전트별 |
| 도구 타이밍 | 세션 리플레이 | 도구 호출별 |
| 세션 종료 요약 | 세션 종료 훅 | 세션별 |
| 파일 소유권 | 서브에이전트 트래커 | 파일별 |
| 병렬 효율성 | 관측소 | 실시간 |

---

## 내장 모니터링

### 에이전트 관측소

에이전트 관측소는 실행 중인 모든 에이전트, 성능 지표, 잠재적 문제에 대한 실시간 가시성을 제공합니다.

#### 관측소 접근

관측소는 에이전트가 실행 중일 때 HUD에 자동으로 표시됩니다. 프로그래밍 방식으로 쿼리할 수도 있습니다:

```typescript
import { getAgentObservatory } from 'oh-my-claudecode/hooks/subagent-tracker';

const obs = getAgentObservatory(process.cwd());
console.log(obs.header);  // "Agent Observatory (3 active, 85% efficiency)"
obs.lines.forEach(line => console.log(line));
```

#### 관측소 출력

```
Agent Observatory (3 active, 85% efficiency)
🟢 [a1b2c3d] executor 45s tools:12 tokens:8k $0.15 files:3
🟢 [e4f5g6h] document-specialist 30s tools:5 tokens:3k $0.08
🟡 [i7j8k9l] architect 120s tools:8 tokens:15k $0.42
   └─ bottleneck: Grep (2.3s avg)
⚠ architect: Cost $0.42 exceeds threshold
```

#### 상태 표시기

| 아이콘 | 의미 |
|------|---------|
| 🟢 | 정상 - 에이전트가 정상적으로 실행 중 |
| 🟡 | 경고 - 개입 권장 |
| 🔴 | 위험 - 오래된 에이전트 (>5분) |

#### 주요 지표

| 지표 | 설명 |
|--------|-------------|
| `tools:N` | 수행된 도구 호출 수 |
| `tokens:Nk` | 대략적인 토큰 사용량 (천 단위) |
| `$X.XX` | USD 예상 비용 |
| `files:N` | 수정 중인 파일 수 |
| `bottleneck` | 가장 느린 반복 도구 작업 |

### 세션 종료 요약

이전 문서에서 설명된 레거시 분석 워크플로우(`omc-analytics`, `omc cost`, `omc backfill`, `analytics` HUD 프리셋)는 더 이상 현재 `dev`의 일부가 아닙니다.

현재 빌드에서 지원되는 모니터링 인터페이스는 다음과 같습니다:

- HUD / API의 **에이전트 관측소**
- `.omc/state/agent-replay-*.jsonl`의 **세션 리플레이** 로그
- `.omc/sessions/<sessionId>.json`의 **세션 종료 요약**
- 설정된 콜백을 통해 전송되는 **세션 종료 알림**

#### 지원되는 검사 명령어

```bash
omc hud
tail -20 .omc/state/agent-replay-*.jsonl
ls .omc/sessions/*.json
```

#### HUD 표시

에이전트 및 컨텍스트 가시성을 위해 `focused` 또는 `full`과 같은 지원 프리셋 사용:

```json
{
  "omcHud": {
    "preset": "focused"
  }
}
```

표시 내용:
- 활성 에이전트 및 상태
- 할 일 / PRD 진행 상황
- 컨텍스트 및 속도 제한 상태
- 백그라운드 작업

### 세션 리플레이

세션 리플레이는 에이전트 생명주기 이벤트를 JSONL 형식으로 기록하여 세션 후 분석 및 타임라인 시각화에 활용합니다.

#### 이벤트 타입

| 이벤트 | 설명 |
|-------|-------------|
| `agent_start` | 작업 정보와 함께 에이전트 생성됨 |
| `agent_stop` | 에이전트가 소요 시간과 함께 완료/실패 |
| `tool_start` | 도구 호출 시작 |
| `tool_end` | 도구가 타이밍과 함께 완료 |
| `file_touch` | 에이전트가 파일 수정 |
| `intervention` | 시스템 개입 트리거됨 |

#### 리플레이 파일

리플레이 데이터 저장 위치: `.omc/state/agent-replay-{sessionId}.jsonl`

각 줄은 JSON 이벤트입니다:
```json
{"t":0.0,"agent":"a1b2c3d","agent_type":"executor","event":"agent_start","task":"기능 구현","parent_mode":"ultrawork"}
{"t":5.2,"agent":"a1b2c3d","event":"tool_start","tool":"Read"}
{"t":5.4,"agent":"a1b2c3d","event":"tool_end","tool":"Read","duration_ms":200,"success":true}
```

#### 리플레이 데이터 분석

```typescript
import { getReplaySummary } from 'oh-my-claudecode/hooks/subagent-tracker/session-replay';

const summary = getReplaySummary(process.cwd(), sessionId);

console.log(`소요 시간: ${summary.duration_seconds}초`);
console.log(`에이전트: ${summary.agents_spawned}개 생성, ${summary.agents_completed}개 완료`);
console.log(`병목 현상:`, summary.bottlenecks);
console.log(`수정된 파일:`, summary.files_touched);
```

#### 병목 현상 감지

리플레이 시스템은 자동으로 병목 현상을 식별합니다:
- 2회 이상 호출되어 평균 >1초인 도구
- 에이전트별 도구 타이밍 분석
- 영향도별 정렬 (평균 시간 높은 순)

---

## HUD 통합

### 프리셋

| 프리셋 | 초점 | 요소 |
|--------|-------|----------|
| `minimal` | 깔끔한 상태 | 컨텍스트 바만 |
| `focused` | 작업 진행 | 할 일, 에이전트, 모드 |
| `full` | 전체 | 모든 요소 활성화 |
| `analytics` | 비용 추적 | 토큰, 비용, 효율성 |
| `dense` | 압축 전체 | 압축 형식 |

### 설정

`~/.claude/settings.json` 편집:

```json
{
  "omcHud": {
    "preset": "focused",
    "elements": {
      "agents": true,
      "todos": true,
      "contextBar": true,
      "analytics": true
    }
  }
}
```

### 커스텀 요소

| 요소 | 설명 |
|---------|-------------|
| `agents` | 활성 에이전트 수 및 상태 |
| `todos` | 할 일 진행 상황 (완료/전체) |
| `ralph` | Ralph 루프 반복 횟수 |
| `autopilot` | Autopilot 단계 표시기 |
| `contextBar` | 컨텍스트 창 사용량 % |
| `analytics` | 토큰/비용 요약 |

---

## 디버깅 기법

### 느린 에이전트 식별

1. **관측소 확인** - 2분 이상 실행 중인 에이전트 탐색
2. **병목 현상 표시기 확인** - 평균 >1초인 도구
3. **에이전트 상태의 tool_usage 검토**

```typescript
import { getAgentPerformance } from 'oh-my-claudecode/hooks/subagent-tracker';

const perf = getAgentPerformance(process.cwd(), agentId);
console.log('도구 타이밍:', perf.tool_timings);
console.log('병목 현상:', perf.bottleneck);
```

### 파일 충돌 감지

여러 에이전트가 동일한 파일을 수정할 때:

```typescript
import { detectFileConflicts } from 'oh-my-claudecode/hooks/subagent-tracker';

const conflicts = detectFileConflicts(process.cwd());
conflicts.forEach(c => {
  console.log(`파일 ${c.file}을 수정한 에이전트: ${c.agents.join(', ')}`);
});
```

### 개입 시스템

OMC는 문제가 있는 에이전트를 자동으로 감지합니다:

| 개입 | 트리거 | 조치 |
|--------------|---------|--------|
| `timeout` | 에이전트 >5분 실행 | 종료 권장 |
| `excessive_cost` | 비용 >$1.00 | 경고 |
| `file_conflict` | 여러 에이전트가 파일 수정 | 경고 |

```typescript
import { suggestInterventions } from 'oh-my-claudecode/hooks/subagent-tracker';

const interventions = suggestInterventions(process.cwd());
interventions.forEach(i => {
  console.log(`${i.type}: ${i.reason} → ${i.suggested_action}`);
});
```

### 병렬 효율성 점수

병렬 에이전트의 성능 추적:

```typescript
import { calculateParallelEfficiency } from 'oh-my-claudecode/hooks/subagent-tracker';

const eff = calculateParallelEfficiency(process.cwd());
console.log(`효율성: ${eff.score}%`);
console.log(`활성: ${eff.active}, 오래된 것: ${eff.stale}, 전체: ${eff.total}`);
```

- **100%**: 모든 에이전트가 활발히 작동 중
- **<80%**: 일부 에이전트가 오래되었거나 대기 중
- **<50%**: 심각한 병렬화 문제

### 오래된 에이전트 정리

타임아웃 임계값을 초과한 에이전트 정리:

```typescript
import { cleanupStaleAgents } from 'oh-my-claudecode/hooks/subagent-tracker';

const cleaned = cleanupStaleAgents(process.cwd());
console.log(`${cleaned}개의 오래된 에이전트 정리됨`);
```

---

## 외부 리소스

### Claude 성능 추적 플랫폼

#### MarginLab.ai

[MarginLab.ai](https://marginlab.ai)는 Claude 모델에 대한 외부 성능 추적을 제공합니다:

- **SWE-Bench-Pro 일별 추적**: 소프트웨어 엔지니어링 벤치마크에서 Claude 성능 모니터링
- **통계적 유의성 검증**: 신뢰 구간으로 성능 저하 감지
- **과거 추세**: 시간에 따른 Claude 능력 추적
- **모델 비교**: Claude 모델 버전 간 성능 비교

#### 사용법

플랫폼 방문:
1. 현재 Claude 모델 벤치마크 점수 확인
2. 과거 성능 추세 확인
3. 중요한 성능 변화에 대한 알림 설정
4. 모델 버전별 비교 (Opus, Sonnet, Haiku)

### 커뮤니티 리소스

| 리소스 | 설명 | 링크 |
|----------|-------------|------|
| Claude Code Discord | 커뮤니티 지원 및 팁 | [discord.gg/anthropic](https://discord.gg/anthropic) |
| OMC GitHub Issues | 버그 신고 및 기능 요청 | [GitHub Issues](https://github.com/Yeachan-Heo/oh-my-claudecode/issues) |
| Anthropic 문서 | 공식 Claude 문서 | [docs.anthropic.com](https://docs.anthropic.com) |

### 모델 성능 벤치마크

표준 벤치마크에서 Claude 성능 추적:

| 벤치마크 | 측정 항목 | 추적 위치 |
|-----------|-----------------|----------------|
| SWE-Bench | 소프트웨어 엔지니어링 작업 | MarginLab.ai |
| HumanEval | 코드 생성 정확도 | 공개 리더보드 |
| MMLU | 일반 지식 | Anthropic 블로그 |

---

## 모범 사례

### 1. 사전적 세션 상태 모니터링

```bash
# HUD에 예산 경고 설정
/oh-my-claudecode:hud
# "focused" 또는 "full" 선택
```

### 2. 적절한 모델 티어 사용

| 작업 유형 | 권장 모델 | 비용 영향 |
|-----------|------------------|-------------|
| 파일 조회 | Haiku | 최저 |
| 기능 구현 | Sonnet | 중간 |
| 아키텍처 결정 | Opus | 최고 |

### 3. 복잡한 작업에 세션 리플레이 활성화

세션 리플레이는 자동으로 활성화됩니다. 복잡한 워크플로우 후 리플레이를 검토하세요:

```bash
# 리플레이 파일 찾기
ls .omc/state/agent-replay-*.jsonl

# 최근 이벤트 보기
tail -20 .omc/state/agent-replay-*.jsonl
```

### 4. 비용 한도 설정

에이전트당 기본 비용 한도는 $1.00 USD입니다. 이를 초과하는 에이전트는 경고를 트리거합니다.

### 5. 정기적으로 병목 현상 검토

복잡한 작업 완료 후 리플레이 요약 확인:

```typescript
const summary = getReplaySummary(cwd, sessionId);
if (summary.bottlenecks.length > 0) {
  console.log('최적화 고려 대상:', summary.bottlenecks[0]);
}
```

### 6. 오래된 상태 정리

오래된 리플레이 파일과 에이전트 상태를 주기적으로 정리하세요:

```typescript
import { cleanupReplayFiles } from 'oh-my-claudecode/hooks/subagent-tracker/session-replay';

cleanupReplayFiles(process.cwd()); // 마지막 10개 세션 유지
```

---

## 문제 해결

### 높은 토큰 사용량

**증상**: 예상보다 높은 비용, 컨텍스트 창이 빠르게 채워짐

**해결책**:
1. 토큰 효율적 실행을 위해 `eco` 모드 사용: `eco fix all errors`
2. 에이전트 프롬프트에서 불필요한 파일 읽기 확인
3. HUD(또는 리플레이 로그)의 에이전트 관측소에서 에이전트별 분석 검토
4. 캐시 활성화 - 분석에서 캐시 효율성 확인

### 느린 에이전트 실행

**증상**: 에이전트가 >5분 실행, 낮은 병렬 효율성

**해결책**:
1. 병목 현상 표시기에 대한 관측소 확인
2. 느린 작업에 대한 tool_usage 검토
3. 큰 작업을 더 작은 에이전트로 분할 고려
4. 간단한 검증에 `architect` 대신 `architect-low` 사용

### 파일 충돌

**증상**: 병합 충돌, 예상치 못한 파일 변경

**해결책**:
1. 자동 파일 소유권을 위해 `team N:executor` 모드 사용
2. 병렬 실행 전 `detectFileConflicts()` 확인
3. 에이전트 상태의 file_ownership 검토
4. 명시적 작업 격리를 통한 `team N:executor` 모드 사용

### 세션 종료 요약 없음

**증상**: 세션 종료 후 `.omc/sessions/*.json` 파일 없음

**해결책**:
1. `session-end` 훅이 실행되도록 세션을 정상적으로 종료
2. HUD / 훅이 설치되어 있는지 확인: `/oh-my-claudecode:hud setup`
3. 현재 워크스페이스 `.omc/sessions/` 디렉토리 확인
4. 타이밍/활동 증거가 필요한 경우 `.omc/state/agent-replay-*.jsonl` 검토

### 오래된 에이전트 상태

**증상**: 실행 중이지 않은 에이전트를 관측소에서 표시

**해결책**:
1. 프로그래밍 방식으로 `cleanupStaleAgents(cwd)` 실행
2. `.omc/state/subagent-tracking.json` 삭제하여 초기화
3. 고아 잠금 파일 확인: `.omc/state/subagent-tracker.lock`

---

## 상태 파일 레퍼런스

| 파일 | 목적 | 형식 |
|------|---------|--------|
| `.omc/state/subagent-tracking.json` | 현재 에이전트 상태 | JSON |
| `.omc/state/agent-replay-{id}.jsonl` | 세션 이벤트 타임라인 | JSONL |
| `.omc/state/token-tracking.jsonl` | 토큰 사용량 로그 | JSONL |
| `.omc/state/analytics-summary-{id}.json` | 캐시된 세션 요약 | JSON |
| `.omc/state/subagent-tracker.lock` | 동시 접근 잠금 | 텍스트 |

---

## API 레퍼런스

### 서브에이전트 트래커

```typescript
// 핵심 추적
getActiveAgentCount(directory: string): number
getRunningAgents(directory: string): SubagentInfo[]
getTrackingStats(directory: string): { running, completed, failed, total }

// 성능
getAgentPerformance(directory: string, agentId: string): AgentPerformance
getAllAgentPerformance(directory: string): AgentPerformance[]
calculateParallelEfficiency(directory: string): { score, active, stale, total }

// 파일 소유권
recordFileOwnership(directory: string, agentId: string, filePath: string): void
detectFileConflicts(directory: string): Array<{ file, agents }>
getFileOwnershipMap(directory: string): Map<string, string>

// 개입
suggestInterventions(directory: string): AgentIntervention[]
cleanupStaleAgents(directory: string): number

// 표시
getAgentDashboard(directory: string): string
getAgentObservatory(directory: string): { header, lines, summary }
```

### 세션 리플레이

```typescript
// 기록
recordAgentStart(directory, sessionId, agentId, agentType, task?, parentMode?, model?): void
recordAgentStop(directory, sessionId, agentId, agentType, success, durationMs?): void
recordToolEvent(directory, sessionId, agentId, toolName, eventType, durationMs?, success?): void
recordFileTouch(directory, sessionId, agentId, filePath): void

// 분석
readReplayEvents(directory: string, sessionId: string): ReplayEvent[]
getReplaySummary(directory: string, sessionId: string): ReplaySummary

// 정리
cleanupReplayFiles(directory: string): number
```

---

## 레거시 분석 시스템 (제거됨)

이슈 #1533에서 참조된 레거시 분석 하위 시스템은 현재 `dev`에 더 이상 존재하지 않습니다.

원래 코드 경로(`src/analytics/session-manager.ts`, `src/analytics/query-engine.ts`, 관련 `omc-analytics` / `omc cost` / `omc backfill` 워크플로우)는 광범위한 분석 정리의 일환으로 커밋 `8011af06`에서 제거되었습니다.

### 제거된 항목

- `omc-analytics`
- `omc cost`, `omc sessions`, `omc export`, `omc backfill`
- HUD `analytics` 프리셋
- `src/analytics/*` 구현 파일
- 이슈 #1533에서 설명된 이전 지표 정리 파이프라인

### 현재 대체 방법

현재 지원되는 인터페이스를 대신 사용하세요:

```bash
omc hud
tail -20 .omc/state/agent-replay-*.jsonl
ls .omc/sessions/*.json
```

통합 훅의 경우, 제거된 분석 명령어 대신 `session-end` 요약 JSON 및 알림 페이로드를 검사하세요.

---

## 참고 문서

- [레퍼런스](./REFERENCE.md) - 완전한 기능 레퍼런스
- [아키텍처](./ARCHITECTURE.md) - 시스템 아키텍처 개요
