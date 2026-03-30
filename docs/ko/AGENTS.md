<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-31 | Updated: 2026-02-24 -->

# docs

oh-my-claudecode의 사용자 문서 및 기술 가이드.

## 목적

이 디렉토리는 최종 사용자와 개발자를 위한 문서를 포함합니다:

- **최종 사용자 가이드**: oh-my-claudecode 기능 사용 방법
- **기술 레퍼런스**: 아키텍처, 호환성, 마이그레이션
- **설계 문서**: 기능 설계 명세

## 주요 파일

| 파일 | 설명 |
|------|------|
| `GETTING-STARTED.md` | 설치, 첫 번째 세션, 설정 가이드 |
| `ARCHITECTURE.md` | 시스템 아키텍처 개요 (에이전트, 스킬, 훅, 상태) |
| `HOOKS.md` | 훅 시스템 종합 문서 (11개 이벤트에 걸쳐 20개 훅) |
| `TOOLS.md` | MCP 도구 레퍼런스 (상태, 노트패드, LSP, AST, Python REPL) |
| `REFERENCE.md` | 에이전트, 스킬, 훅, 설정 빠른 레퍼런스 |
| `FEATURES.md` | 내부 개발자 API 레퍼런스 |
| `CLAUDE.md` | 최종 사용자 오케스트레이션 지침 (사용자 프로젝트에 설치됨) |
| `MIGRATION.md` | 버전 마이그레이션 가이드 |
| `COMPATIBILITY.md` | MCP/플러그인 호환성 레이어 문서 |
| `DELEGATION-ENFORCER.md` | 위임 프로토콜 문서 |
| `SYNC-SYSTEM.md` | 메타데이터 동기화 시스템 |
| `PERFORMANCE-MONITORING.md` | 성능 모니터링 및 디버깅 가이드 |
| `LOCAL_PLUGIN_INSTALL.md` | 개발자를 위한 로컬 플러그인 설치 |
| `OPENCLAW-ROUTING.md` | OpenClaw/Clawhip 라우팅 계약 |
| `CJK-IME-KNOWN-ISSUES.md` | CJK 입력기 알려진 이슈 |

## 하위 디렉토리

| 디렉토리 | 목적 |
|----------|------|
| `design/` | 기능 설계 명세 및 아키텍처 제안 |
| `agent-templates/` | 재사용 가능한 에이전트 프롬프트 템플릿 |
| `partials/` | 재사용 가능한 문서 조각 |
| `ko/` | 문서의 한국어 번역 |
| `issues/` | 버그 참조 자료 |

## AI 에이전트를 위한 안내

### 이 디렉토리에서 작업하기

1. **최종 사용자 중심**: CLAUDE.md는 사용자 프로젝트에 설치되므로 개발자가 아닌 최종 사용자를 위해 작성하세요
2. **링크 접근성 유지**: CLAUDE.md의 링크는 raw GitHub URL을 사용하세요 (에이전트는 GitHub UI를 탐색할 수 없음)
3. **버전 일관성**: 릴리스 시 모든 문서에서 버전 번호를 업데이트하세요

### 각 파일을 업데이트해야 할 때

| 트리거 | 업데이트할 파일 |
|---------|---------------|
| 에이전트 수 또는 목록 변경 | `REFERENCE.md` (에이전트 섹션) |
| 스킬 수 또는 목록 변경 | `REFERENCE.md` (스킬 섹션) |
| 훅 수 또는 목록 변경 | `REFERENCE.md` (훅 시스템 섹션) |
| 매직 키워드 변경 | `REFERENCE.md` (매직 키워드 섹션) |
| 에이전트 도구 할당 변경 | `CLAUDE.md` (에이전트 도구 매트릭스) |
| 스킬 구성 또는 아키텍처 변경 | `ARCHITECTURE.md` |
| 새 내부 API 또는 기능 | `FEATURES.md` |
| 호환성 변경 또는 마이그레이션 | `MIGRATION.md` |
| 계층화된 에이전트 설계 업데이트 | `design/TIERED_AGENTS_V2.md` |
| 플랫폼 또는 버전 지원 변경 | `COMPATIBILITY.md` |
| 최종 사용자 지침 변경 | `CLAUDE.md` |
| 주요 사용자 대면 기능 | `../README.md` |

### 테스트 요구사항

- 마크다운이 올바르게 렌더링되는지 확인
- 모든 내부 링크가 해결되는지 확인
- 문서의 코드 예시 검증

### 공통 패턴

#### Raw 콘텐츠 링크

외부 접근성을 위해 raw GitHub URL 사용:

[마이그레이션 가이드](https://raw.githubusercontent.com/Yeachan-Heo/oh-my-claudecode/main/docs/MIGRATION.md)

#### 버전 참조

제목 뒤에 빈 줄이 있는 일관된 버전 제목 형식 사용:

```markdown
## v3.8.17 변경 사항

- 기능 A
- 기능 B
```

## 의존성

### 내부

- `agents/`의 에이전트 참조
- `skills/`의 스킬 참조
- `src/tools/`의 도구 참조

### 외부

없음 - 순수 마크다운 파일.

<!-- MANUAL:
- plan/ralplan 문서화 시, 합의 구조화 심의(RALPLAN-DR)를 포함하고 --deliberate 고위험 모드 동작을 명시하세요.
-->
