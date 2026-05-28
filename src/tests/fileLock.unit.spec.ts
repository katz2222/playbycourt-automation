import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import os from "os";
import {
  acquireFileLock,
  releaseFileLock,
} from "../utilities/slotsHistory.util";

function uniqueLockPath(): string {
  return path.join(
    os.tmpdir(),
    `test-lock-${Date.now()}-${Math.random().toString(36).slice(2)}.lock`,
  );
}

function cleanup(lockPath: string): void {
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // ignore if already removed
  }
}

/**
 * 9.1 Test acquireFileLock creates lock file
 */
test("acquireFileLock creates lock file on disk", async () => {
  const lockPath = uniqueLockPath();
  try {
    await acquireFileLock(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);
  } finally {
    cleanup(lockPath);
  }
});

/**
 * 9.2 Test concurrent acquisition blocks
 */
test("concurrent acquireFileLock blocks until first lock is released", async () => {
  const lockPath = uniqueLockPath();
  try {
    // Acquire the first lock
    await acquireFileLock(lockPath);

    // Attempt to acquire a second lock with a short timeout
    const secondAcquire = acquireFileLock(lockPath, {
      timeoutMs: 500,
      retryDelayMs: 50,
    });

    // Release the first lock after a short delay
    const releaseAfterDelay = new Promise<void>((resolve) => {
      setTimeout(() => {
        releaseFileLock(lockPath);
        resolve();
      }, 200);
    });

    // The second acquire should succeed after the first is released
    await Promise.all([secondAcquire, releaseAfterDelay]);

    // Lock file should exist again (second acquire succeeded)
    expect(fs.existsSync(lockPath)).toBe(true);
  } finally {
    cleanup(lockPath);
  }
});

/**
 * 9.3 Test stale lock recovery
 */
test("acquireFileLock removes stale lock and acquires successfully", async () => {
  const lockPath = uniqueLockPath();
  try {
    // Create a lock file manually with mtime > 60s in the past
    fs.writeFileSync(lockPath, "");
    const pastTime = new Date(Date.now() - 120_000); // 120 seconds ago
    fs.utimesSync(lockPath, pastTime, pastTime);

    // acquireFileLock should detect the stale lock, remove it, and acquire
    await acquireFileLock(lockPath, { staleLockMs: 60_000 });

    // Lock file should exist (newly created by acquireFileLock)
    expect(fs.existsSync(lockPath)).toBe(true);
  } finally {
    cleanup(lockPath);
  }
});

/**
 * 9.4 Test timeout behavior
 */
test("acquireFileLock throws after timeout when lock is held", async () => {
  const lockPath = uniqueLockPath();
  try {
    // Create a lock file manually (simulates a held lock with recent mtime)
    fs.writeFileSync(lockPath, "");

    // Attempt to acquire with a short timeout — should reject
    await expect(
      acquireFileLock(lockPath, {
        timeoutMs: 500,
        retryDelayMs: 50,
        staleLockMs: 600_000,
      }),
    ).rejects.toThrow(/Failed to acquire file lock/);
  } finally {
    cleanup(lockPath);
  }
});

/**
 * 9.5 Test releaseFileLock removes file
 */
test("releaseFileLock removes the lock file", () => {
  const lockPath = uniqueLockPath();
  // Create a lock file manually
  fs.writeFileSync(lockPath, "");
  expect(fs.existsSync(lockPath)).toBe(true);

  releaseFileLock(lockPath);
  expect(fs.existsSync(lockPath)).toBe(false);
});

test("releaseFileLock does not throw on non-existent file", () => {
  const lockPath = uniqueLockPath();
  // Ensure file does not exist
  expect(fs.existsSync(lockPath)).toBe(false);

  // Should not throw
  expect(() => releaseFileLock(lockPath)).not.toThrow();
});
