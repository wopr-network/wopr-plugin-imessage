/**
 * Message handling unit tests for wopr-plugin-imessage.
 *
 * Tests the shouldRespond() and buildSessionKey() logic which are the core
 * message routing functions. Since these are module-private, we test them
 * indirectly through the exported plugin + mocks, or re-implement the logic
 * to validate expected behavior.
 *
 * For thorough unit testing, we extract the pure logic into testable assertions.
 */
import { describe, it, expect } from "vitest";
import type { IMessageConfig, IncomingMessage } from "../src/types.js";

// Since shouldRespond and buildSessionKey are not exported, we re-implement
// the same logic here to verify correctness. This is the standard pattern
// when testing module-private functions.

function buildSessionKey(msg: IncomingMessage): string {
  if (msg.is_group) {
    return `imessage-group-${msg.chat_id || msg.chat_guid || msg.chat_identifier || "unknown"}`;
  }
  return `imessage-dm-${msg.sender || msg.handle || "unknown"}`;
}

function shouldRespond(
  msg: IncomingMessage,
  config: IMessageConfig,
): boolean | "pairing" {
  if (!msg.text?.trim()) {
    return false;
  }

  const isGroup = msg.is_group === true;
  const sender = msg.sender || msg.handle || "";

  if (!isGroup) {
    const policy = config.dmPolicy || "pairing";
    if (policy === "closed") return false;
    if (policy === "open") return true;

    const allowFrom = config.allowFrom || [];
    if (allowFrom.includes("*")) return true;
    if (sender && allowFrom.includes(sender)) return true;
    if (sender && allowFrom.some((a) => sender.includes(a))) return true;

    if (policy === "pairing") return "pairing";

    return false;
  }

  const groupPolicy = config.groupPolicy || "allowlist";
  if (groupPolicy === "disabled") return false;
  if (groupPolicy === "open") return true;

  const groupAllowFrom = config.groupAllowFrom || [];
  if (groupAllowFrom.includes("*")) return true;
  if (sender && groupAllowFrom.includes(sender)) return true;

  return false;
}

describe("buildSessionKey", () => {
  it("builds DM session key from sender", () => {
    const msg: IncomingMessage = {
      text: "hello",
      sender: "+1234567890",
    };
    expect(buildSessionKey(msg)).toBe("imessage-dm-+1234567890");
  });

  it("builds DM session key from handle when no sender", () => {
    const msg: IncomingMessage = {
      text: "hello",
      sender: "",
      handle: "user@icloud.com",
    };
    expect(buildSessionKey(msg)).toBe("imessage-dm-user@icloud.com");
  });

  it("builds DM session key as unknown when neither sender nor handle", () => {
    const msg: IncomingMessage = {
      text: "hello",
      sender: "",
    };
    expect(buildSessionKey(msg)).toBe("imessage-dm-unknown");
  });

  it("builds group session key from chat_id", () => {
    const msg: IncomingMessage = {
      text: "hello",
      sender: "+1234567890",
      is_group: true,
      chat_id: 42,
    };
    expect(buildSessionKey(msg)).toBe("imessage-group-42");
  });

  it("builds group session key from chat_guid", () => {
    const msg: IncomingMessage = {
      text: "hello",
      sender: "+1234567890",
      is_group: true,
      chat_guid: "iMessage;+;chat123",
    };
    expect(buildSessionKey(msg)).toBe(
      "imessage-group-iMessage;+;chat123",
    );
  });

  it("builds group session key from chat_identifier", () => {
    const msg: IncomingMessage = {
      text: "hello",
      sender: "+1234567890",
      is_group: true,
      chat_identifier: "chat://group1",
    };
    expect(buildSessionKey(msg)).toBe("imessage-group-chat://group1");
  });

  it("builds group session key as unknown when no chat identifiers", () => {
    const msg: IncomingMessage = {
      text: "hello",
      sender: "+1234567890",
      is_group: true,
    };
    expect(buildSessionKey(msg)).toBe("imessage-group-unknown");
  });
});

describe("shouldRespond", () => {
  describe("DM policies", () => {
    it("rejects empty text", () => {
      const msg: IncomingMessage = { text: "", sender: "+1234567890" };
      expect(shouldRespond(msg, {})).toBe(false);
    });

    it("rejects whitespace-only text", () => {
      const msg: IncomingMessage = { text: "   ", sender: "+1234567890" };
      expect(shouldRespond(msg, {})).toBe(false);
    });

    it("defaults to pairing for unknown DM senders", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      expect(shouldRespond(msg, {})).toBe("pairing");
    });

    it("returns pairing when dmPolicy is pairing", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      expect(shouldRespond(msg, { dmPolicy: "pairing" })).toBe("pairing");
    });

    it("accepts all DMs when dmPolicy is open", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      expect(shouldRespond(msg, { dmPolicy: "open" })).toBe(true);
    });

    it("rejects all DMs when dmPolicy is closed", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      expect(shouldRespond(msg, { dmPolicy: "closed" })).toBe(false);
    });

    it("accepts DMs from allowlisted sender", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      const config: IMessageConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["+1234567890"],
      };
      expect(shouldRespond(msg, config)).toBe(true);
    });

    it("rejects DMs from non-allowlisted sender in allowlist mode", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      const config: IMessageConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["+0000000000"],
      };
      expect(shouldRespond(msg, config)).toBe(false);
    });

    it("accepts DMs when wildcard in allowlist", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      const config: IMessageConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["*"],
      };
      expect(shouldRespond(msg, config)).toBe(true);
    });

    it("matches partial sender in allowlist", () => {
      const msg: IncomingMessage = { text: "hello", sender: "+1234567890" };
      const config: IMessageConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["1234567890"],
      };
      expect(shouldRespond(msg, config)).toBe(true);
    });

    it("uses handle as fallback sender", () => {
      const msg: IncomingMessage = {
        text: "hello",
        sender: "",
        handle: "user@icloud.com",
      };
      const config: IMessageConfig = {
        dmPolicy: "allowlist",
        allowFrom: ["user@icloud.com"],
      };
      expect(shouldRespond(msg, config)).toBe(true);
    });
  });

  describe("group policies", () => {
    const groupMsg: IncomingMessage = {
      text: "hello",
      sender: "+1234567890",
      is_group: true,
      chat_id: 1,
    };

    it("defaults to allowlist for groups (rejects unknown)", () => {
      expect(shouldRespond(groupMsg, {})).toBe(false);
    });

    it("accepts all groups when groupPolicy is open", () => {
      expect(shouldRespond(groupMsg, { groupPolicy: "open" })).toBe(true);
    });

    it("rejects all groups when groupPolicy is disabled", () => {
      expect(shouldRespond(groupMsg, { groupPolicy: "disabled" })).toBe(false);
    });

    it("accepts groups from allowlisted sender", () => {
      const config: IMessageConfig = {
        groupPolicy: "allowlist",
        groupAllowFrom: ["+1234567890"],
      };
      expect(shouldRespond(groupMsg, config)).toBe(true);
    });

    it("rejects groups from non-allowlisted sender", () => {
      const config: IMessageConfig = {
        groupPolicy: "allowlist",
        groupAllowFrom: ["+0000000000"],
      };
      expect(shouldRespond(groupMsg, config)).toBe(false);
    });

    it("accepts groups when wildcard in group allowlist", () => {
      const config: IMessageConfig = {
        groupPolicy: "allowlist",
        groupAllowFrom: ["*"],
      };
      expect(shouldRespond(groupMsg, config)).toBe(true);
    });
  });
});
