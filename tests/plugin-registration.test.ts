/**
 * Plugin registration tests for wopr-plugin-imessage.
 *
 * Verifies plugin metadata, config schema registration, and lifecycle.
 * The init() call spawns a child process (imsg CLI) which won't exist in CI,
 * so we mock the logger and test the parts that don't require macOS.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the logger before importing the plugin
vi.mock("../src/logger.js", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		verbose: vi.fn(),
	},
}));

// Mock child_process to prevent actual imsg spawning
vi.mock("node:child_process", () => ({
	spawn: vi.fn(() => {
		const EventEmitter = require("node:events");
		const child = new EventEmitter();
		child.stdin = { write: vi.fn(), end: vi.fn() };
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		child.killed = false;
		child.kill = vi.fn();
		// Simulate immediate exit so start() resolves quickly
		setTimeout(() => child.emit("close", 1, null), 10);
		return child;
	}),
}));

import plugin from "../src/index.js";
import { logger } from "../src/logger.js";
import { createMockContext } from "./mocks/wopr-context.js";

describe("plugin registration", () => {
	it("exports a valid WOPRPlugin object", () => {
		expect(plugin).toBeDefined();
		expect(plugin.name).toBe("wopr-plugin-imessage");
		expect(plugin.version).toBe("1.0.0");
		expect(plugin.description).toContain("iMessage");
	});

	it("has required lifecycle methods", () => {
		expect(typeof plugin.init).toBe("function");
		expect(typeof plugin.shutdown).toBe("function");
	});

	it("registers config schema on init", async () => {
		const ctx = createMockContext();
		// On non-macOS, init will warn and return early (after registering schema)
		// On macOS without imsg, it will fail at client.start()
		// Either way, registerConfigSchema should be called first
		try {
			await plugin.init!(ctx);
		} catch {
			// Expected on non-macOS or when imsg fails
		}

		expect(ctx.registerConfigSchema).toHaveBeenCalledWith(
			"wopr-plugin-imessage",
			expect.objectContaining({
				title: expect.stringContaining("iMessage"),
				fields: expect.any(Array),
			}),
		);
	});

	it("config schema has expected fields", async () => {
		const ctx = createMockContext();
		try {
			await plugin.init!(ctx);
		} catch {
			// Expected
		}

		const call = (ctx.registerConfigSchema as any).mock.calls[0];
		const schema = call[1];
		const fieldNames = schema.fields.map((f: any) => f.name);

		expect(fieldNames).toContain("enabled");
		expect(fieldNames).toContain("cliPath");
		expect(fieldNames).toContain("service");
		expect(fieldNames).toContain("dmPolicy");
		expect(fieldNames).toContain("groupPolicy");
		expect(fieldNames).toContain("textChunkLimit");
	});

	it("warns on non-macOS platform and returns early", async () => {
		// We're running on Linux in CI, so init should warn about platform
		const ctx = createMockContext();
		const originalPlatform = process.platform;

		// Force non-darwin
		Object.defineProperty(process, "platform", { value: "linux" });
		try {
			await plugin.init!(ctx);
		} catch {
			// May throw on some paths
		}
		Object.defineProperty(process, "platform", { value: originalPlatform });

		// On non-macOS, the plugin should warn about the platform
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("iMessage plugin requires macOS"),
		);
	});

	it("shutdown is safe when not initialized", async () => {
		// Calling shutdown before init should not throw
		await expect(plugin.shutdown!()).resolves.toBeUndefined();
	});
});

describe("plugin manifest", () => {
	it("has a complete manifest", () => {
		expect(plugin.manifest).toBeDefined();
		expect(plugin.manifest!.name).toBe("@wopr-network/wopr-plugin-imessage");
		expect(plugin.manifest!.version).toBe("1.0.0");
		expect(plugin.manifest!.capabilities).toContain("channel");
		expect(plugin.manifest!.capabilities).toContain("imessage");
		expect(plugin.manifest!.category).toBe("channel");
		expect(plugin.manifest!.tags).toEqual(
			expect.arrayContaining(["imessage", "sms", "macos", "channel"]),
		);
		expect(plugin.manifest!.icon).toBeDefined();
		expect(plugin.manifest!.requires).toBeDefined();
		expect(plugin.manifest!.requires!.os).toEqual(["darwin"]);
		expect(plugin.manifest!.requires!.bins).toEqual(["imsg"]);
		expect(plugin.manifest!.lifecycle).toBeDefined();
		expect(plugin.manifest!.lifecycle!.shutdownBehavior).toBe("graceful");
		expect(plugin.manifest!.configSchema).toBeDefined();
	});
});

describe("plugin shutdown cleanup", () => {
	afterEach(async () => {
		try {
			await plugin.shutdown!();
		} catch {
			// ignore
		}
	});

	it("shutdown unregisters config schema and nulls ctx", async () => {
		const ctx = createMockContext();

		const originalPlatform = process.platform;
		Object.defineProperty(process, "platform", { value: "linux" });
		try {
			await plugin.init!(ctx);
		} catch {
			// Expected on non-darwin
		}
		Object.defineProperty(process, "platform", { value: originalPlatform });

		await plugin.shutdown!();

		expect(ctx.unregisterConfigSchema).toHaveBeenCalledWith(
			"wopr-plugin-imessage",
		);
	});
});

describe("plugin config schema setupFlow", () => {
	it("config schema fields have setupFlow where appropriate", async () => {
		const ctx = createMockContext();
		try {
			await plugin.init!(ctx);
		} catch {
			// Expected
		}
		await plugin.shutdown!();

		const call = (ctx.registerConfigSchema as any).mock.calls[0];
		const schema = call[1];

		const cliPathField = schema.fields.find((f: any) => f.name === "cliPath");
		expect(cliPathField.setupFlow).toBe("paste");

		const dbPathField = schema.fields.find((f: any) => f.name === "dbPath");
		expect(dbPathField.setupFlow).toBe("paste");

		const enabledField = schema.fields.find((f: any) => f.name === "enabled");
		expect(enabledField.setupFlow).toBe("none");

		const serviceField = schema.fields.find((f: any) => f.name === "service");
		expect(serviceField.setupFlow).toBe("none");
	});
});

describe("plugin A2A tools", () => {
	afterEach(async () => {
		try {
			await plugin.shutdown!();
		} catch {
			// ignore
		}
	});

	it("registers A2A server when ctx.registerA2AServer exists", async () => {
		const ctx = createMockContext();
		ctx.registerA2AServer = vi.fn();

		const originalPlatform = process.platform;
		Object.defineProperty(process, "platform", { value: "linux" });
		try {
			await plugin.init!(ctx);
		} catch {
			// Expected on non-darwin
		}
		Object.defineProperty(process, "platform", { value: originalPlatform });

		expect(ctx.registerA2AServer).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "wopr-plugin-imessage",
				tools: expect.arrayContaining([
					expect.objectContaining({ name: "imessage.listPairings" }),
					expect.objectContaining({ name: "imessage.approvePairing" }),
				]),
			}),
		);
	});

	it("skips A2A registration when ctx.registerA2AServer is undefined", async () => {
		const ctx = createMockContext();
		delete (ctx as any).registerA2AServer;

		const originalPlatform = process.platform;
		Object.defineProperty(process, "platform", { value: "linux" });
		// Should not throw
		await expect(plugin.init!(ctx)).resolves.toBeUndefined();
		Object.defineProperty(process, "platform", { value: originalPlatform });
	});
});
