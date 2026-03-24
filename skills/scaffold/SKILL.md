---
name: scaffold
description: Use when generating the hackathon project's code structure — stubs, mocks, dependency injection, Terraform, LocalStack, dev scripts, and Feature Zero. Triggered by /hack scaffold.
---

# Scaffold Skill

Generates the hackathon project's complete technical foundation. Run this after init, team-inventory, research, and storming are complete. All files are created in the TARGET hackathon project repo.

## Prerequisites

Before running scaffold, verify:

1. Tracking issue #1 exists with populated sponsor tools table.
2. Tool research artifacts exist in `docs/tools/*/` for each sponsor tool.
3. Hackathon-storming output exists with prioritized feature list and architecture decisions.
4. You are in the target hackathon project directory (not the plugin repo).

Read these to understand the project context:

```bash
gh issue view 1 --json body --jq '.body'
ls docs/tools/
cat docs/plans/*storming* 2>/dev/null || echo "No storming plan found"
```

---

## Step 1: Project Structure

Initialize a Next.js app with the standard hackathon stack.

```bash
pnpm create next-app . --typescript --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*" --no-turbopack
```

If the directory already has files (e.g., from init), run in a temp directory and merge:

```bash
pnpm create next-app .scaffold-tmp --typescript --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*" --no-turbopack
cp -rn .scaffold-tmp/* .scaffold-tmp/.* . 2>/dev/null || true
rm -rf .scaffold-tmp
```

Install additional dependencies:

```bash
# Testing
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom

# E2E
pnpm add -D playwright @playwright/test

# UI components
pnpm dlx shadcn@latest init -y

# Project-specific deps (adjust based on research)
# For each sponsor tool that has an SDK, install it:
# pnpm add @{{tool-vendor}}/{{sdk-name}}
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint && tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:smoke": "USE_MOCKS=true vitest run test/smoke.test.ts"
  }
}
```

---

## Step 2: Stubs and Mocks

For **each** sponsor tool identified in the tracking issue and researched in `docs/tools/*/`, generate three files. Replace `{{tool}}` with the actual tool name (lowercase, kebab-case).

### `src/lib/{{tool}}/client.ts` — Real Client

```typescript
// src/lib/{{tool}}/client.ts
//
// Real {{Tool}} client. Throws until credentials are configured.

export interface {{Tool}}Client {
  // Define methods based on research artifacts in docs/tools/{{tool}}/
  // Example:
  // query(input: string): Promise<{{Tool}}QueryResult>;
  // upsert(data: {{Tool}}Record[]): Promise<void>;
}

export function create{{Tool}}Client(): {{Tool}}Client {
  const apiKey = process.env.{{TOOL}}_API_KEY;
  if (!apiKey) {
    throw new Error(
      "{{TOOL}}_API_KEY is not set. Run with USE_MOCKS=true for local dev."
    );
  }

  // Initialize the real SDK client here.
  // Reference: docs/tools/{{tool}}/README.md
  // Example:
  // import { {{Tool}}SDK } from '@{{vendor}}/{{sdk}}';
  // const sdk = new {{Tool}}SDK({ apiKey });

  return {
    // Implement real methods using the SDK.
    // Each method should include error handling per docs/tools/{{tool}}/SKILL.md
    async query(_input: string) {
      throw new Error("{{Tool}}.query() not yet implemented");
    },
  } satisfies {{Tool}}Client;
}
```

### `src/lib/{{tool}}/mock.ts` — Mock Client

```typescript
// src/lib/{{tool}}/mock.ts
//
// Mock {{Tool}} client for local development and testing.

import type { {{Tool}}Client } from "./client";

export function createMock{{Tool}}Client(): {{Tool}}Client {
  console.log("[mock] Using mock {{Tool}} client");

  return {
    async query(_input: string) {
      // Return realistic fake data matching the tool's response shape.
      // Base this on the API response schemas in docs/tools/{{tool}}/SKILL.md
      return {
        results: [
          {
            id: "mock-1",
            score: 0.95,
            metadata: { label: "mock result" },
          },
        ],
      };
    },
  } satisfies {{Tool}}Client;
}
```

### `src/lib/{{tool}}/index.ts` — Barrel Export with Mock Switching

```typescript
// src/lib/{{tool}}/index.ts
//
// Barrel export — switches between real and mock based on USE_MOCKS env var.

import type { {{Tool}}Client } from "./client";

export type { {{Tool}}Client };
// Re-export any shared types
// export type { {{Tool}}QueryResult, {{Tool}}Record } from "./client";

let _client: {{Tool}}Client | null = null;

export async function get{{Tool}}Client(): Promise<{{Tool}}Client> {
  if (_client) return _client;

  if (process.env.USE_MOCKS === "true") {
    const { createMock{{Tool}}Client } = await import("./mock");
    _client = createMock{{Tool}}Client();
  } else {
    const { create{{Tool}}Client } = await import("./client");
    _client = create{{Tool}}Client();
  }

  return _client;
}

/** Reset the singleton (useful in tests). */
export function reset{{Tool}}Client(): void {
  _client = null;
}
```

### Important

- Generate one set of these three files per sponsor tool.
- Tailor the interface methods and mock data to the actual API surface discovered during research. Read the tool's SKILL.md and README.md for method signatures and response shapes.
- Use `satisfies` to ensure mock and real clients conform to the same interface.

---

## Step 3: Dependency Injection Container

Create a centralized container that lazily resolves all tool clients.

### `src/lib/container.ts`

```typescript
// src/lib/container.ts
//
// Lazy dependency injection container for all tool clients.
// Imports are dynamic so unused tools don't load at startup.

type LazyFactory<T> = () => Promise<T>;

class Container {
  private singletons = new Map<string, unknown>();

  private async resolve<T>(key: string, factory: LazyFactory<T>): Promise<T> {
    if (!this.singletons.has(key)) {
      this.singletons.set(key, await factory());
    }
    return this.singletons.get(key) as T;
  }

  /** Reset all singletons (for testing). */
  reset(): void {
    this.singletons.clear();
  }

  // --- Tool Clients ---
  // Add one getter per sponsor tool. Example:

  // async {{tool}}() {
  //   return this.resolve("{{tool}}", async () => {
  //     const { get{{Tool}}Client } = await import("@/lib/{{tool}}");
  //     return get{{Tool}}Client();
  //   });
  // }

  // --- Data Manager ---
  async dataManager() {
    return this.resolve("dataManager", async () => {
      const { createDataManager } = await import("@/lib/data/manager");
      return createDataManager();
    });
  }
}

export const container = new Container();
```

Add one method per sponsor tool. The dynamic `import()` ensures that tools not used on a particular code path are never loaded.

---

## Step 4: Terraform Root Module

Compose a root Terraform module from the research fragments already generated in `docs/tools/*/`.

### `infra/main.tf`

```hcl
# infra/main.tf
#
# Root Terraform module for {{PROJECT_NAME}}.
# Composes provider-specific fragments from docs/tools/*/main.tf.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    # Add providers discovered during research, e.g.:
    # pinecone = {
    #   source  = "pinecone-io/pinecone"
    #   version = "~> 0.7"
    # }
  }

  # Remote state — use S3 if AWS is part of the stack, otherwise local
  # backend "s3" {
  #   bucket = "{{project}}-tfstate"
  #   key    = "terraform.tfstate"
  #   region = var.aws_region
  # }
}

provider "aws" {
  region = var.aws_region

  # For LocalStack dev:
  # skip_credentials_validation = true
  # skip_metadata_api_check     = true
  # skip_requesting_account_id  = true
  # endpoints {
  #   s3     = "http://localhost:4566"
  #   sqs    = "http://localhost:4566"
  #   lambda = "http://localhost:4566"
  # }
}

# --- S3 Bucket for test data / uploads ---
resource "aws_s3_bucket" "data" {
  bucket = "${var.project_name}-data-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_cors_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    max_age_seconds = 3000
  }
}

# --- Additional resources per sponsor tool ---
# Inline or module-reference the fragments from docs/tools/*/main.tf
# Example:
# module "pinecone" {
#   source = "../docs/tools/pinecone"
#   ...
# }
```

### `infra/variables.tf`

```hcl
# infra/variables.tf

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "{{project-name}}"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# Add variables for each sponsor tool that needs Terraform config.
# Reference docs/tools/*/variables.tf for required inputs.
```

### `infra/outputs.tf`

```hcl
# infra/outputs.tf

output "data_bucket_name" {
  description = "S3 bucket name for data uploads"
  value       = aws_s3_bucket.data.id
}

output "data_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.data.arn
}

# Add outputs for each sponsor tool resource.
# These values feed into .env via scripts/env-from-terraform.sh.
```

Merge any Terraform fragments found in `docs/tools/*/main.tf` and `docs/tools/*/variables.tf` into the root module. Adapt resource names and variable references to avoid collisions.

---

## Step 5: LocalStack Docker Compose

Generate a `docker-compose.yml` for local AWS development. Adjust the `SERVICES` list based on what the Terraform module provisions.

### `docker-compose.yml`

```yaml
# docker-compose.yml
#
# LocalStack for local AWS development.
# Start: docker compose up -d
# Stop:  docker compose down

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"       # LocalStack edge port
      - "4510-4559:4510-4559" # External service ports
    environment:
      # Adjust SERVICES based on what infra/main.tf provisions
      - SERVICES=s3,sqs,lambda
      - DEBUG=0
      - DATA_DIR=/var/lib/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - localstack_data:/var/lib/localstack
      - /var/run/docker.sock:/var/run/docker.sock
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  localstack_data:
```

---

## Step 6: Dev Scripts

Create four executable scripts. All must be `chmod +x`.

### `scripts/env-from-terraform.sh`

```bash
#!/usr/bin/env bash
# scripts/env-from-terraform.sh
#
# Extracts Terraform outputs into .env format.
# Usage: ./scripts/env-from-terraform.sh >> .env

set -euo pipefail

cd "$(dirname "$0")/../infra"

echo "# --- Terraform outputs (auto-generated) ---"

# S3
echo "DATA_BUCKET_NAME=$(terraform output -raw data_bucket_name 2>/dev/null || echo 'NOT_SET')"
echo "DATA_BUCKET_ARN=$(terraform output -raw data_bucket_arn 2>/dev/null || echo 'NOT_SET')"

# Add outputs for each sponsor tool resource.
# Example:
# echo "PINECONE_INDEX_HOST=$(terraform output -raw pinecone_index_host 2>/dev/null || echo 'NOT_SET')"
```

### `scripts/env-local.sh`

```bash
#!/usr/bin/env bash
# scripts/env-local.sh
#
# Sets environment for local development with LocalStack + mocks.
# Usage: source scripts/env-local.sh

export USE_MOCKS=true
export NODE_ENV=development

# LocalStack AWS
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# S3
export DATA_BUCKET_NAME={{project-name}}-data-dev

# Source project .env for any real credentials the developer has set
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "Local environment configured (USE_MOCKS=$USE_MOCKS)"
```

### `scripts/dev.sh`

```bash
#!/usr/bin/env bash
# scripts/dev.sh
#
# Start the full local dev stack: LocalStack + Next.js dev server.
# Usage: ./scripts/dev.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Source local env
source scripts/env-local.sh

# Start LocalStack if docker is available and compose file exists
if command -v docker &>/dev/null && [ -f docker-compose.yml ]; then
  echo "Starting LocalStack..."
  docker compose up -d

  # Wait for LocalStack to be ready
  echo "Waiting for LocalStack..."
  timeout 30 bash -c 'until curl -sf http://localhost:4566/_localstack/health > /dev/null 2>&1; do sleep 1; done' \
    && echo "LocalStack ready" \
    || echo "Warning: LocalStack not ready (continuing anyway)"

  # Create S3 bucket if it doesn't exist
  aws --endpoint-url=http://localhost:4566 s3 mb "s3://$DATA_BUCKET_NAME" 2>/dev/null || true
fi

# Start Next.js dev server
echo "Starting Next.js dev server..."
exec pnpm dev
```

### `scripts/seed.sh`

```bash
#!/usr/bin/env bash
# scripts/seed.sh
#
# Seeds local development data (LocalStack S3, mock databases, etc.).
# Usage: ./scripts/seed.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

source scripts/env-local.sh

echo "=== Seeding local development data ==="

# Create S3 bucket
echo "Creating S3 bucket: $DATA_BUCKET_NAME"
aws --endpoint-url="$AWS_ENDPOINT_URL" s3 mb "s3://$DATA_BUCKET_NAME" 2>/dev/null || true

# Upload sample data if it exists
if [ -d "test/fixtures/sample-data" ]; then
  echo "Uploading sample data to S3..."
  aws --endpoint-url="$AWS_ENDPOINT_URL" s3 sync \
    test/fixtures/sample-data/ "s3://$DATA_BUCKET_NAME/uploads/" \
    --quiet
  echo "Uploaded $(ls test/fixtures/sample-data/ | wc -l | tr -d ' ') files"
fi

# Add tool-specific seeding here.
# Example:
# echo "Seeding Pinecone mock index..."
# curl -X POST http://localhost:{{port}}/seed ...

echo "=== Seed complete ==="
```

Make all scripts executable:

```bash
chmod +x scripts/env-from-terraform.sh scripts/env-local.sh scripts/dev.sh scripts/seed.sh
```

---

## Step 7: Smoke Test

Create a smoke test that validates the scaffold is wired correctly.

### `test/smoke.test.ts`

```typescript
// test/smoke.test.ts
//
// Smoke test: verifies scaffold wiring — mock switching, client imports, container.

import { describe, it, expect, beforeAll } from "vitest";

describe("Scaffold smoke test", () => {
  beforeAll(() => {
    // Ensure mocks are enabled (also set in vitest setup, but be explicit)
    process.env.USE_MOCKS = "true";
  });

  it("should have USE_MOCKS set to true", () => {
    expect(process.env.USE_MOCKS).toBe("true");
  });

  // --- For each sponsor tool, add an import test ---
  // Example:
  //
  // it("should import {{tool}} client without error", async () => {
  //   const { get{{Tool}}Client } = await import("@/lib/{{tool}}");
  //   const client = await get{{Tool}}Client();
  //   expect(client).toBeDefined();
  // });

  it("should import data manager without error", async () => {
    const { createDataManager } = await import("@/lib/data/manager");
    const manager = createDataManager();
    expect(manager).toBeDefined();
  });

  it("should resolve container clients", async () => {
    const { container } = await import("@/lib/container");
    container.reset();

    // Test data manager resolution
    const dataManager = await container.dataManager();
    expect(dataManager).toBeDefined();

    // Add one assertion per sponsor tool:
    // const {{tool}}Client = await container.{{tool}}();
    // expect({{tool}}Client).toBeDefined();
  });
});
```

Add one `it("should import {{tool}} client without error")` block per sponsor tool.

---

## Step 8: Feature Zero — Test Data Manager

Feature Zero is always the first P0. It proves the full stack works: UI, API route, mock storage.

### `src/lib/data/manager.ts`

```typescript
// src/lib/data/manager.ts
//
// Data manager — handles file uploads, metadata, and tagging.
// Uses mock S3 when USE_MOCKS=true, real S3 otherwise.

export interface DataFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  tags: string[];
  uploadedAt: string;
  url: string;
}

export interface DataManager {
  upload(file: File): Promise<DataFile>;
  list(): Promise<DataFile[]>;
  getById(id: string): Promise<DataFile | null>;
  addTag(id: string, tag: string): Promise<DataFile>;
  removeTag(id: string, tag: string): Promise<DataFile>;
  delete(id: string): Promise<void>;
}

// In-memory store for mock mode
const mockStore = new Map<string, DataFile>();

function createMockDataManager(): DataManager {
  return {
    async upload(file: File): Promise<DataFile> {
      const id = crypto.randomUUID();
      const dataFile: DataFile = {
        id,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        tags: [],
        uploadedAt: new Date().toISOString(),
        url: `/api/data/${id}`,
      };
      mockStore.set(id, dataFile);
      return dataFile;
    },

    async list(): Promise<DataFile[]> {
      return Array.from(mockStore.values()).sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    },

    async getById(id: string): Promise<DataFile | null> {
      return mockStore.get(id) ?? null;
    },

    async addTag(id: string, tag: string): Promise<DataFile> {
      const file = mockStore.get(id);
      if (!file) throw new Error(`File not found: ${id}`);
      if (!file.tags.includes(tag)) {
        file.tags.push(tag);
      }
      return file;
    },

    async removeTag(id: string, tag: string): Promise<DataFile> {
      const file = mockStore.get(id);
      if (!file) throw new Error(`File not found: ${id}`);
      file.tags = file.tags.filter((t) => t !== tag);
      return file;
    },

    async delete(id: string): Promise<void> {
      mockStore.delete(id);
    },
  };
}

function createS3DataManager(): DataManager {
  // Real S3 implementation — uses AWS SDK.
  // Will be implemented when real credentials are configured.
  const bucketName = process.env.DATA_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("DATA_BUCKET_NAME is not set");
  }

  throw new Error("S3 DataManager not yet implemented — use USE_MOCKS=true");
}

export function createDataManager(): DataManager {
  if (process.env.USE_MOCKS === "true") {
    return createMockDataManager();
  }
  return createS3DataManager();
}
```

### `src/app/api/data/route.ts`

```typescript
// src/app/api/data/route.ts
//
// API route for data file management (upload, list, tag).

import { NextRequest, NextResponse } from "next/server";
import { createDataManager } from "@/lib/data/manager";

const manager = createDataManager();

export async function GET() {
  try {
    const files = await manager.list();
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const dataFile = await manager.upload(file);

    // Apply tags if provided
    const tags = formData.get("tags") as string | null;
    if (tags) {
      for (const tag of tags.split(",").map((t) => t.trim()).filter(Boolean)) {
        await manager.addTag(dataFile.id, tag);
      }
    }

    return NextResponse.json({ file: dataFile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "No file ID provided" },
        { status: 400 }
      );
    }
    await manager.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

### `src/app/data/page.tsx`

```tsx
// src/app/data/page.tsx
//
// Feature Zero: Test Data Manager UI
// Upload, preview, and tag test data files.

"use client";

import { useCallback, useEffect, useState } from "react";

interface DataFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  tags: string[];
  uploadedAt: string;
  url: string;
}

export default function DataManagerPage() {
  const [files, setFiles] = useState<DataFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/data", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
      }
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddTag = async (fileId: string) => {
    const tag = tagInput[fileId]?.trim();
    if (!tag) return;

    try {
      const res = await fetch(`/api/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fileId, action: "addTag", tag }),
      });
      if (res.ok) {
        setTagInput((prev) => ({ ...prev, [fileId]: "" }));
        await fetchFiles();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add tag");
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await fetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fileId }),
      });
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold">Test Data Manager</h1>
        <p className="mb-8 text-muted-foreground">
          Upload, preview, and tag test data files for the hackathon project.
        </p>

        {/* Upload Section */}
        <div className="mb-8 rounded-lg border border-dashed border-border p-8 text-center">
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-primary hover:underline"
          >
            {uploading ? "Uploading..." : "Click to upload files"}
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop or click to select files
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-destructive">
            {error}
          </div>
        )}

        {/* File List */}
        <div className="space-y-4">
          {files.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No files uploaded yet.
            </p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{file.filename}</h3>
                    <p className="text-sm text-muted-foreground">
                      {file.contentType} &middot; {formatSize(file.size)}{" "}
                      &middot;{" "}
                      {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {file.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={tagInput[file.id] || ""}
                      onChange={(e) =>
                        setTagInput((prev) => ({
                          ...prev,
                          [file.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddTag(file.id)
                      }
                      className="h-6 w-24 rounded border border-input bg-transparent px-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Step 9: Vitest Config

### `vitest.config.ts`

```typescript
// vitest.config.ts

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts", "test/**/*.test.tsx", "src/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

### `test/setup.ts`

```typescript
// test/setup.ts
//
// Vitest global setup — ensures mock mode is active for all tests.

import "@testing-library/jest-dom";

// Force mock mode in tests
process.env.USE_MOCKS = "true";
process.env.NODE_ENV = "test";
```

---

## Step 10: Run Smoke Test

Execute the smoke test to verify the scaffold is correctly wired:

```bash
USE_MOCKS=true pnpm vitest run test/smoke.test.ts
```

**Expected:** All tests PASS. If any fail:

1. Read the error message carefully.
2. Fix the specific import or configuration issue.
3. Re-run until all tests pass.

Common issues:
- Path alias `@/` not resolving: check `vitest.config.ts` has the `resolve.alias` config.
- Missing `@testing-library/jest-dom` types: ensure `test/setup.ts` imports it and `vitest.config.ts` references setup file.
- Module not found: verify all `src/lib/*/index.ts` barrel exports exist.

---

## Step 11: Commit and Push

Stage all scaffold files and commit:

```bash
git add -A
git commit -m "feat: scaffold project structure, mocks, DI, dev scripts, Feature Zero

- Next.js app with TypeScript, Tailwind, ESLint, app router
- Stub and mock clients for each sponsor tool (USE_MOCKS switching)
- Dependency injection container with lazy imports
- Terraform root module composing research fragments
- LocalStack docker-compose for local AWS
- Dev scripts: env-from-terraform, env-local, dev, seed
- Feature Zero: Test Data Manager (upload, preview, tag)
- Vitest config with jsdom and smoke test
- All smoke tests passing"

git push
```

---

## Step 12: Update Tracking Issue

### 12.1 Check Off Scaffold

```bash
BODY=$(gh issue view 1 --json body --jq '.body')
UPDATED_BODY=$(echo "$BODY" | sed 's/- \[ \] Scaffold committed/- [x] Scaffold committed/')
gh issue edit 1 --body "$UPDATED_BODY"
```

### 12.2 Add Completion Comment

```bash
gh issue comment 1 --body "$(cat <<'EOF'
## Scaffold Complete

**Project structure created:**
- Next.js app (TypeScript, Tailwind, ESLint, app router, src directory)
- Vitest + Playwright test infrastructure
- shadcn/ui components

**Mock system:**
- `src/lib/<tool>/client.ts` — real client stubs (throws until configured)
- `src/lib/<tool>/mock.ts` — fake data for local dev
- `src/lib/<tool>/index.ts` — barrel with `USE_MOCKS` switching

**Infrastructure:**
- `src/lib/container.ts` — lazy DI container
- `infra/` — Terraform root module (S3 + sponsor tool resources)
- `docker-compose.yml` — LocalStack for local AWS
- `scripts/` — env-from-terraform, env-local, dev, seed (all executable)

**Feature Zero — Test Data Manager:**
- `src/app/data/page.tsx` — upload, preview, tag UI
- `src/app/api/data/route.ts` — API routes
- `src/lib/data/manager.ts` — mock S3 data manager

**Tests:**
- `vitest.config.ts` — jsdom environment, setup file
- `test/smoke.test.ts` — verifies mock switching and all client imports
- Smoke test: PASS

**Next step:** Run `/hack` to begin building P0 features.
EOF
)"
```

---

## Error Handling

- If `pnpm create next-app` fails because the directory is not empty, use the temp directory approach from Step 1.
- If a sponsor tool has no SDK, create a raw HTTP client in `client.ts` using `fetch`.
- If no Terraform fragments exist in `docs/tools/*/`, create a minimal root module with just the S3 bucket.
- If Docker is not available, skip LocalStack setup in `scripts/dev.sh` and note it in the commit.
- If the smoke test fails after 3 fix attempts, commit what works and note failures in the tracking issue comment.
