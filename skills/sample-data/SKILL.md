---
name: sample-data
description: Use when managing hackathon test data — analyzes requirements, suggests sourcing strategy, tracks coverage, and validates ground truth. Triggered by /hack data.
---

# Sample Data Skill

Manages hackathon test data: requirements analysis, sourcing strategy, manifest tracking, ground truth annotations, and validation scripts. Test data files live in S3 (not the repo), but the manifest and ground truth files are committed. Feature Zero (test data manager) is the upload/preview UI.

## Prerequisites

Before running sample-data, verify:

1. Tracking issue #1 exists with populated sponsor tools table.
2. Hackathon rules skill exists at `.claude/skills/hackathon-rules/SKILL.md` in the target project.
3. Architecture plan exists in `docs/plans/`.
4. Scaffold is complete (Feature Zero data manager is available).
5. You are in the target hackathon project directory (not the plugin repo).

Read these to understand the project context:

```bash
gh issue view 1 --json body --jq '.body'
cat .claude/skills/hackathon-rules/SKILL.md
ls docs/plans/*storming* 2>/dev/null || ls docs/plans/*.md 2>/dev/null
cat test/fixtures/manifest.json 2>/dev/null || echo "No manifest yet"
```

---

## Step 1: Analyze Requirements

Read the hackathon rules and architecture plan to determine what test data is needed.

Identify and document:

1. **Data types needed** — what kinds of input does the pipeline consume? (e.g., video clips, audio files, images, text documents, API payloads, CSV datasets)
2. **Properties that matter** — for each data type, what properties affect processing? (e.g., duration, resolution, format, language, file size, encoding)
3. **Ground truth annotations needed** — what should the pipeline detect or produce? (e.g., violations, classifications, entities, scores) These become the expected outputs used for validation.
4. **Sample counts for a convincing demo** — enough to show the system works across edge cases, but not so many that curation becomes a bottleneck. Typical targets:
   - **Demo data:** 3-5 carefully chosen samples that showcase the happy path clearly
   - **Test data:** 10-20 samples covering edge cases, failure modes, and boundary conditions
   - **Stress data:** 2-3 samples at the upper bound of expected size/complexity

Write the analysis to `docs/plans/YYYY-MM-DD-HHMM-test-data-requirements.md` using the current timestamp.

---

## Step 2: Sourcing Strategy

Present a table of data types with sourcing recommendations. Choose from these strategies (in order of preference):

| Strategy | When to use | Pros | Cons |
|----------|-------------|------|------|
| **Organizer-provided** | Hackathon gives sample data | Closest to judging conditions | Often limited quantity |
| **Public datasets** | Well-known benchmarks exist | Credible, reproducible | May need subsetting |
| **Team-created** | Domain-specific, no public source | Full control over ground truth | Time-consuming |
| **Generated/synthetic** | Need volume or edge cases | Unlimited quantity, perfect labels | May not reflect real-world distribution |

### Output Format

Create a sourcing table for the tracking issue:

```markdown
### Test Data Sourcing Strategy

| Data Type | Count | Source Strategy | Source Detail | Purpose | Status |
|-----------|-------|-----------------|---------------|---------|--------|
| {{type}} | {{n}} | {{strategy}} | {{detail}} | demo/test/both | pending |
```

Add this table to tracking issue #1 via `gh issue edit` (append to body) or as a comment if the body is already long.

---

## Step 3: Manifest Management

Create or update `test/fixtures/manifest.json` to track all test data files. The manifest is the single source of truth for what data exists and what it should produce.

### Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "version": { "type": "string", "const": "1.0" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "type", "source", "purpose"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier (kebab-case, e.g., 'meeting-normal-01')"
          },
          "name": {
            "type": "string",
            "description": "Human-readable name"
          },
          "type": {
            "type": "string",
            "description": "Data type (e.g., 'video', 'audio', 'image', 'document', 'csv')"
          },
          "source": {
            "type": "string",
            "enum": ["organizer-provided", "public-dataset", "team-created", "synthetic"]
          },
          "s3Key": {
            "type": "string",
            "description": "S3 object key (path within the data bucket)"
          },
          "metadata": {
            "type": "object",
            "properties": {
              "duration": { "type": "number", "description": "Duration in seconds (for audio/video)" },
              "format": { "type": "string", "description": "File format (e.g., 'mp4', 'wav', 'png')" },
              "size": { "type": "number", "description": "File size in bytes" },
              "resolution": { "type": "string", "description": "Resolution (e.g., '1920x1080')" },
              "language": { "type": "string", "description": "Language code (e.g., 'en')" },
              "tags": {
                "type": "array",
                "items": { "type": "string" },
                "description": "Searchable tags for categorization"
              }
            }
          },
          "groundTruth": {
            "type": "object",
            "properties": {
              "expectedViolations": {
                "type": "array",
                "items": { "type": "string" },
                "description": "List of violation types this sample should trigger"
              },
              "annotationsPath": {
                "type": "string",
                "description": "Relative path to ground truth file (e.g., 'test/fixtures/expected-violations/meeting-normal-01.json')"
              }
            }
          },
          "purpose": {
            "type": "string",
            "enum": ["demo", "test", "both"],
            "description": "Whether this sample is for demo, testing, or both"
          }
        }
      }
    }
  }
}
```

### Example Manifest

```json
{
  "version": "1.0",
  "updatedAt": "2026-03-24T14:30:00Z",
  "items": [
    {
      "id": "meeting-normal-01",
      "name": "Normal team standup (no violations)",
      "type": "video",
      "source": "team-created",
      "s3Key": "uploads/meeting-normal-01.mp4",
      "metadata": {
        "duration": 180,
        "format": "mp4",
        "size": 15728640,
        "resolution": "1920x1080",
        "language": "en",
        "tags": ["meeting", "clean", "baseline"]
      },
      "groundTruth": {
        "expectedViolations": [],
        "annotationsPath": "test/fixtures/expected-violations/meeting-normal-01.json"
      },
      "purpose": "both"
    }
  ]
}
```

### Creating the Manifest

```bash
mkdir -p test/fixtures
# Create manifest.json if it doesn't exist, or read existing to update
cat test/fixtures/manifest.json 2>/dev/null || echo '{"version":"1.0","updatedAt":"","items":[]}'
```

When adding items, always:
- Generate a unique kebab-case `id`
- Set `updatedAt` to the current ISO timestamp
- Include the `groundTruth` section even if annotations are not yet created (set `expectedViolations` to the known list and leave `annotationsPath` pointing to the file you will create in Step 4)

---

## Step 4: Ground Truth Files

For each manifest item that has expected violations, create a ground truth annotation file in `test/fixtures/expected-violations/`.

### Directory Structure

```
test/fixtures/expected-violations/
├── meeting-normal-01.json
├── meeting-violation-pii-01.json
├── document-sensitive-01.json
└── ...
```

### Ground Truth File Schema

```json
{
  "id": "meeting-violation-pii-01",
  "sourceManifestId": "meeting-violation-pii-01",
  "annotations": [
    {
      "violationType": "pii-exposure",
      "timestamp": 45.2,
      "timestampEnd": 48.7,
      "confidence": {
        "min": 0.85,
        "max": 1.0
      },
      "description": "Speaker reads out a Social Security number on camera",
      "location": {
        "type": "temporal",
        "start": 45.2,
        "end": 48.7
      },
      "metadata": {
        "severity": "critical",
        "category": "personal-data",
        "subType": "ssn"
      }
    }
  ],
  "summary": {
    "totalViolations": 1,
    "violationTypes": ["pii-exposure"],
    "maxSeverity": "critical"
  }
}
```

### Guidelines

- **Temporal data** (audio/video): use `timestamp` and `timestampEnd` in seconds.
- **Spatial data** (images): use `location.type: "spatial"` with bounding box coordinates.
- **Document data**: use `location.type: "textual"` with page number, paragraph, or character offset.
- **Confidence ranges**: set `min` to the lowest acceptable confidence score the pipeline should produce, and `max` to the upper bound. This allows fuzzy matching in validation.
- **One file per manifest item**: the filename must match the manifest item's `id`.

```bash
mkdir -p test/fixtures/expected-violations
```

Create one JSON file per manifest item that has non-empty `expectedViolations`. Items with no expected violations (clean baseline samples) still get a ground truth file with an empty `annotations` array — this validates that the pipeline correctly reports no violations.

---

## Step 5: Coverage Tracking

Update the tracking issue's Test Data Coverage table to reflect current state.

### Coverage Table Format

```markdown
### Test Data Coverage

| Violation Type | Demo Samples | Test Samples | Ground Truth | Status |
|---------------|-------------|-------------|--------------|--------|
| {{type}} | {{n}}/{{target}} | {{n}}/{{target}} | {{complete?}} | {{emoji}} |
| _clean baseline_ | {{n}} | {{n}} | {{complete?}} | {{emoji}} |

**Overall:** {{total}} samples, {{with_gt}} with ground truth ({{pct}}% coverage)
```

### Updating the Tracking Issue

```bash
# Read current issue body
BODY=$(gh issue view 1 --json body --jq '.body')

# If a Test Data Coverage section already exists, replace it; otherwise append
if echo "$BODY" | grep -q "### Test Data Coverage"; then
  # Replace existing section (from header to next ### or end of file)
  UPDATED_BODY=$(echo "$BODY" | sed '/### Test Data Coverage/,/^### [^T]/{ /^### [^T]/!d; }' | sed '/### Test Data Coverage/r /dev/stdin' <<< "$NEW_TABLE")
  gh issue edit 1 --body "$UPDATED_BODY"
else
  # Append
  gh issue edit 1 --body "$BODY

$NEW_TABLE"
fi
```

### Coverage Comment

After updating the table, add a comment with stats:

```bash
gh issue comment 1 --body "$(cat <<EOF
## Test Data Update

**Manifest:** \`test/fixtures/manifest.json\` — {{n}} items
**Ground truth:** {{n}}/{{total}} files created ({{pct}}% coverage)

### Breakdown
- Demo samples: {{n}} (target: {{target}})
- Test samples: {{n}} (target: {{target}})
- Clean baselines: {{n}}
- Edge cases: {{n}}

### Next steps
- [ ] {{remaining items to source or annotate}}
EOF
)"
```

---

## Step 6: Validation Script

Create `scripts/validate-data.sh` to compare pipeline output against ground truth. This script is the objective measure of pipeline quality.

### `scripts/validate-data.sh`

```bash
#!/usr/bin/env bash
# scripts/validate-data.sh
#
# Validates pipeline output against ground truth annotations.
# Computes precision, recall, and F1 per violation type.
#
# Usage:
#   ./scripts/validate-data.sh <pipeline-output-dir> [manifest-path]
#
# Arguments:
#   pipeline-output-dir  Directory containing pipeline output JSON files
#                        (one per input sample, named by manifest ID)
#   manifest-path        Path to manifest.json (default: test/fixtures/manifest.json)
#
# Output:
#   Per-type and aggregate precision/recall/F1 scores
#   Exit code 0 if all types meet threshold, 1 otherwise

set -euo pipefail

PIPELINE_DIR="${1:?Usage: validate-data.sh <pipeline-output-dir> [manifest-path]}"
MANIFEST="${2:-test/fixtures/manifest.json}"
GT_DIR="test/fixtures/expected-violations"
THRESHOLD="${VALIDATION_THRESHOLD:-0.70}"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: Manifest not found: $MANIFEST"
  exit 1
fi

if [ ! -d "$PIPELINE_DIR" ]; then
  echo "ERROR: Pipeline output directory not found: $PIPELINE_DIR"
  exit 1
fi

echo "=== Data Validation ==="
echo "Manifest:        $MANIFEST"
echo "Pipeline output: $PIPELINE_DIR"
echo "Ground truth:    $GT_DIR"
echo "F1 threshold:    $THRESHOLD"
echo ""

# Use node/jq to compute metrics — prefer node since it's in the project stack
if command -v node &>/dev/null; then
  node -e "
const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('$MANIFEST', 'utf8'));
const pipelineDir = '$PIPELINE_DIR';
const gtDir = '$GT_DIR';
const threshold = $THRESHOLD;

// Collect per-type TP/FP/FN
const stats = {};

function ensureType(type) {
  if (!stats[type]) stats[type] = { tp: 0, fp: 0, fn: 0 };
}

let totalSamples = 0;
let processedSamples = 0;

for (const item of manifest.items) {
  totalSamples++;

  const gtPath = item.groundTruth?.annotationsPath
    ? path.resolve(item.groundTruth.annotationsPath)
    : path.join(gtDir, item.id + '.json');

  const pipelinePath = path.join(pipelineDir, item.id + '.json');

  if (!fs.existsSync(gtPath)) {
    console.warn('WARN: No ground truth for ' + item.id + ', skipping');
    continue;
  }

  if (!fs.existsSync(pipelinePath)) {
    console.warn('WARN: No pipeline output for ' + item.id + ', skipping');
    // Count all expected violations as false negatives
    const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));
    for (const ann of (gt.annotations || [])) {
      ensureType(ann.violationType);
      stats[ann.violationType].fn++;
    }
    continue;
  }

  processedSamples++;

  const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));
  const pipeline = JSON.parse(fs.readFileSync(pipelinePath, 'utf8'));

  const expectedViolations = gt.annotations || [];
  const detectedViolations = pipeline.violations || pipeline.annotations || [];

  // Match detected to expected by type (and timestamp if temporal)
  const matched = new Set();

  for (const detected of detectedViolations) {
    const type = detected.violationType || detected.type;
    ensureType(type);

    let foundMatch = false;
    for (let i = 0; i < expectedViolations.length; i++) {
      if (matched.has(i)) continue;
      const expected = expectedViolations[i];

      if (expected.violationType === type) {
        // Check confidence is within expected range
        const conf = detected.confidence || 0;
        const minConf = expected.confidence?.min || 0;
        const maxConf = expected.confidence?.max || 1;

        if (conf >= minConf && conf <= maxConf) {
          stats[type].tp++;
          matched.add(i);
          foundMatch = true;
          break;
        }
      }
    }

    if (!foundMatch) {
      stats[type].fp++;
    }
  }

  // Unmatched expected violations are false negatives
  for (let i = 0; i < expectedViolations.length; i++) {
    if (!matched.has(i)) {
      const type = expectedViolations[i].violationType;
      ensureType(type);
      stats[type].fn++;
    }
  }
}

// Compute and display metrics
console.log('Samples: ' + processedSamples + '/' + totalSamples + ' processed\n');
console.log('Type                     | Precision | Recall | F1     | TP | FP | FN');
console.log('-------------------------|-----------|--------|--------|----|----|---');

let allPass = true;
let totalTP = 0, totalFP = 0, totalFN = 0;

for (const [type, s] of Object.entries(stats).sort()) {
  const precision = s.tp + s.fp > 0 ? s.tp / (s.tp + s.fp) : 0;
  const recall = s.tp + s.fn > 0 ? s.tp / (s.tp + s.fn) : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

  const pass = f1 >= threshold;
  if (!pass) allPass = false;

  const mark = pass ? 'PASS' : 'FAIL';
  console.log(
    type.padEnd(25) + '| ' +
    precision.toFixed(3).padStart(9) + ' | ' +
    recall.toFixed(3).padStart(6) + ' | ' +
    f1.toFixed(3).padStart(6) + ' | ' +
    String(s.tp).padStart(2) + ' | ' +
    String(s.fp).padStart(2) + ' | ' +
    String(s.fn).padStart(2) + '  ' + mark
  );

  totalTP += s.tp;
  totalFP += s.fp;
  totalFN += s.fn;
}

const aggPrecision = totalTP + totalFP > 0 ? totalTP / (totalTP + totalFP) : 0;
const aggRecall = totalTP + totalFN > 0 ? totalTP / (totalTP + totalFN) : 0;
const aggF1 = aggPrecision + aggRecall > 0
  ? 2 * aggPrecision * aggRecall / (aggPrecision + aggRecall) : 0;

console.log('-------------------------|-----------|--------|--------|----|----|---');
console.log(
  'AGGREGATE'.padEnd(25) + '| ' +
  aggPrecision.toFixed(3).padStart(9) + ' | ' +
  aggRecall.toFixed(3).padStart(6) + ' | ' +
  aggF1.toFixed(3).padStart(6) + ' | ' +
  String(totalTP).padStart(2) + ' | ' +
  String(totalFP).padStart(2) + ' | ' +
  String(totalFN).padStart(2)
);

console.log('');
if (allPass) {
  console.log('RESULT: ALL PASS (threshold: ' + threshold + ')');
  process.exit(0);
} else {
  console.log('RESULT: SOME TYPES BELOW THRESHOLD (' + threshold + ')');
  process.exit(1);
}
  "
else
  echo "ERROR: node is required for validation. Install Node.js and retry."
  exit 1
fi
```

Make the script executable:

```bash
chmod +x scripts/validate-data.sh
```

### Interpreting Results

- **Precision**: of all violations the pipeline detected, how many were correct?
- **Recall**: of all violations that should have been detected, how many were found?
- **F1**: harmonic mean of precision and recall. The `VALIDATION_THRESHOLD` env var controls the minimum acceptable F1 (default 0.70).

If a violation type scores below threshold:
1. Check if the ground truth annotations are accurate.
2. Check if the pipeline output format matches what the script expects (`violations` or `annotations` array with `violationType` and `confidence` fields).
3. Review the specific false positives and false negatives to guide pipeline improvements.

---

## Step 7: Commit and Update Tracking Issue

Stage all test data artifacts and commit:

```bash
git add test/fixtures/manifest.json test/fixtures/expected-violations/ scripts/validate-data.sh
git commit -m "feat: add test data manifest, ground truth, and validation script

- Manifest with {{n}} items ({{demo}} demo, {{test}} test)
- Ground truth annotations for {{n}} samples
- Validation script computing precision/recall/F1 per violation type"

git push
```

Update the tracking issue:

```bash
gh issue comment 1 --body "$(cat <<'EOF'
## Sample Data Complete

**Manifest:** `test/fixtures/manifest.json` — {{n}} items tracked
**Ground truth:** `test/fixtures/expected-violations/` — {{n}} annotation files
**Validation:** `scripts/validate-data.sh` — computes precision/recall/F1

### Data Coverage
| Violation Type | Samples | Ground Truth | Status |
|---------------|---------|--------------|--------|
| {{type}} | {{n}} | complete | ready |

**Next step:** Upload actual data files to S3 via Feature Zero, then run validation.
EOF
)"
```

---

## Error Handling

- If the hackathon rules skill does not exist yet, ask the user to run `/hack init` first or provide rules directly.
- If no architecture plan exists, work from the hackathon rules alone and note assumptions in the plan file.
- If the manifest already exists, read it and merge new items (never overwrite existing entries without confirmation).
- If ground truth annotations conflict with the manifest, flag the discrepancy and ask the user to resolve.
- If the validation script produces unexpected results, check that pipeline output filenames match manifest item IDs.
- If `node` is not available for the validation script, fall back to `jq`-based validation with reduced functionality and note the limitation.
