# E2E Test Infra: HiVocab THPT Room & DOCX Extraction

## Test Philosophy
- Requirement-driven, opaque-box & empirical validation.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise + Real-World Workload Testing.

## Feature Inventory & Test Coverage
| # | Feature | Requirement | Tier 1 (Functional) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|-------------|:-------------------:|:-----------------:|:----------------------:|:-----------------:|
| 1 | DOCX Run Formatting | ORIGINAL_REQUEST §R2 | 5 cases | 5 cases | ✓ | ✓ |
| 2 | Normalized Section Structure | ORIGINAL_REQUEST §R2 | 5 cases | 5 cases | ✓ | ✓ |
| 3 | Passage & Prompt Separation | ORIGINAL_REQUEST §R3 | 5 cases | 5 cases | ✓ | ✓ |
| 4 | Offline JSON Sync | ORIGINAL_REQUEST §R4 | 5 cases | 5 cases | ✓ | ✓ |
| 5 | 29 Chuyên Đề Navigation | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 6 | Exercise Mode in PageThptRoom | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 7 | Two-Column Split (Theory/Passage) | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 8 | Untimed Stopwatch Mode | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 9 | Immediate Explanation Mode | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 10 | Return Navigation to 29 Chuyên Đề | ORIGINAL_REQUEST §R1 | 5 cases | 5 cases | ✓ | ✓ |
| 11 | Supabase Database Sync | ORIGINAL_REQUEST §R4 | 5 cases | 5 cases | ✓ | ✓ |
| 12 | Production Build Zero Errors | ORIGINAL_REQUEST §R4 | 5 cases | 5 cases | ✓ | ✓ |

## Test Architecture
- Test Runner: Custom Node.js validation runner `scripts/test_thpt_e2e.mjs` + existing `scripts/unit-test.js` + `scripts/smoke-test.js`.
- Build Runner: `cmd.exe /c "npm run build"`.
- Database Verifier: Supabase MCP `execute_sql` queries verifying row counts and integrity.
