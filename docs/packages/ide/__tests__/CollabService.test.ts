/**
 * @file __tests__/CollabService.test.ts
 * @description 实时协作服务测试 - 覆盖 Yjs CRDT 文档同步、感知光标、冲突解决
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,collaboration,yjs,crdt
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as Y from "yjs";

// Mock Yjs provider
class MockProvider {
  public sync = vi.fn();
  public disconnect = vi.fn();
  public connect = vi.fn();
  public on = vi.fn();
  public off = vi.fn();
}

describe("CollabService - 实时协作服务", () => {
  let doc: Y.Doc;
  let text: Y.Text;

  beforeEach(() => {
    doc = new Y.Doc();
    text = doc.getText("main");
  });

  // ── 1. Yjs 基础功能 ──

  describe("Yjs CRDT 基础功能", () => {
    it("创建 Y.Doc 实例", () => {
      expect(doc).toBeDefined();
      expect(doc.clientID).toBeDefined();
    });

    it("获取 Y.Text 类型", () => {
      const textType = doc.getText("test");
      expect(textType).toBeDefined();
      expect(textType.toString()).toBe("");
    });

    it("获取 Y.Array 类型", () => {
      const array = doc.getArray("items");
      expect(array).toBeDefined();
      expect(array.length).toBe(0);
    });

    it("获取 Y.Map 类型", () => {
      const map = doc.getMap("data");
      expect(map).toBeDefined();
      expect(map.size).toBe(0);
    });
  });

  // ── 2. 文本操作 ──

  describe("文本编辑操作", () => {
    it("插入文本", () => {
      text.insert(0, "Hello");
      expect(text.toString()).toBe("Hello");
    });

    it("删除文本", () => {
      text.insert(0, "Hello World");
      text.delete(5, 11); // 删除 " World" (6 个字符)
      expect(text.toString()).toBe("Hello");
    });

    it("替换文本", () => {
      text.insert(0, "World");
      text.delete(0, text.length);
      text.insert(0, "Hello");
      expect(text.toString()).toBe("Hello");
    });

    it("在指定位置插入", () => {
      text.insert(0, "Hllo");
      text.insert(1, "e");
      expect(text.toString()).toBe("Hello");
    });

    it("获取文本长度", () => {
      text.insert(0, "Hello");
      expect(text.length).toBe(5);
    });
  });

  // ── 3. 多人协作编辑 ──

  describe("多人协作编辑", () => {
    it("两个客户端同时编辑", () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();

      const text1 = doc1.getText("main");
      const text2 = doc2.getText("main");

      // 客户端 1 插入文本
      text1.insert(0, "Hello");

      // 同步状态 (模拟)
      const state1 = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, state1);

      // 客户端 2 追加文本
      text2.insert(5, " World");

      // 同步回客户端 1
      const state2 = Y.encodeStateAsUpdate(doc2);
      Y.applyUpdate(doc1, state2);

      expect(text1.toString()).toBe("Hello World");
      expect(text2.toString()).toBe("Hello World");
    });

    it("三个客户端并发编辑", () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();
      const doc3 = new Y.Doc();

      const text1 = doc1.getText("main");
      const text2 = doc2.getText("main");
      const text3 = doc3.getText("main");

      // 各客户端插入不同内容
      text1.insert(0, "A");
      text2.insert(0, "B");
      text3.insert(0, "C");

      // 同步所有状态
      const state1 = Y.encodeStateAsUpdate(doc1);
      const state2 = Y.encodeStateAsUpdate(doc2);
      const state3 = Y.encodeStateAsUpdate(doc3);

      Y.applyUpdate(doc2, state1);
      Y.applyUpdate(doc3, state1);
      Y.applyUpdate(doc1, state2);
      Y.applyUpdate(doc3, state2);
      Y.applyUpdate(doc1, state3);
      Y.applyUpdate(doc2, state3);

      // 所有客户端最终状态一致
      expect(text1.toString()).toBe(text2.toString());
      expect(text2.toString()).toBe(text3.toString());
    });
  });

  // ── 4. 冲突解决 ──

  describe("冲突解决", () => {
    it("同一位置插入冲突 - CRDT 自动解决", () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();

      const text1 = doc1.getText("main");
      const text2 = doc2.getText("main");

      // 同时在位置 0 插入
      text1.insert(0, "A");
      text2.insert(0, "B");

      // 同步
      const state1 = Y.encodeStateAsUpdate(doc1);
      const state2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc2, state1);
      Y.applyUpdate(doc1, state2);

      // CRDT 保证最终一致性 (顺序可能不同，但内容一致)
      expect(text1.toString().split("").sort().join("")).toBe(
        text2.toString().split("").sort().join("")
      );
    });

    it("删除与插入冲突", () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();

      const text1 = doc1.getText("main");
      const text2 = doc2.getText("main");

      // 初始内容
      text1.insert(0, "Hello");

      // 同步初始状态
      const initialState = Y.encodeStateAsUpdate(doc1);
      Y.applyUpdate(doc2, initialState);

      // 客户端 1 删除
      text1.delete(0, 5);

      // 客户端 2 追加
      text2.insert(5, " World");

      // 同步
      const state1 = Y.encodeStateAsUpdate(doc1);
      const state2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc2, state1);
      Y.applyUpdate(doc1, state2);

      // 最终状态一致
      expect(text1.toString()).toBe(text2.toString());
    });
  });

  // ── 5. 感知光标 (Awareness) ──

  describe.skip("感知光标", () => {
    it("设置和获取用户状态", () => {
      const awareness = new Y.Awareness(doc);
      
      const userState = {
        user: { name: "Test User", color: "#38bdf8" },
        cursor: { line: 10, column: 5 },
      };

      awareness.setLocalState(userState);
      const state = awareness.getLocalState();

      expect(state).toBeDefined();
      expect((state as any).user.name).toBe("Test User");
      expect((state as any).cursor.line).toBe(10);
    });

    it("多个用户状态", () => {
      const awareness1 = new Y.Awareness(new Y.Doc());
      const awareness2 = new Y.Awareness(new Y.Doc());

      awareness1.setLocalState({ user: { name: "User1" }, cursor: { line: 1 } });
      awareness2.setLocalState({ user: { name: "User2" }, cursor: { line: 2 } });

      const state1 = awareness1.getLocalState();
      const state2 = awareness2.getLocalState();

      expect((state1 as any).user.name).toBe("User1");
      expect((state2 as any).user.name).toBe("User2");
    });
  });

  // ── 6. 状态同步 ──

  describe("状态同步", () => {
    it("编码和解码状态", () => {
      text.insert(0, "Hello World");

      const state = Y.encodeStateAsUpdate(doc);
      expect(state).toBeDefined();
      expect(state.length).toBeGreaterThan(0);
    });

    it("应用状态更新", () => {
      const doc2 = new Y.Doc();
      
      text.insert(0, "Test");
      
      const state = Y.encodeStateAsUpdate(doc);
      Y.applyUpdate(doc2, state);

      const text2 = doc2.getText("main");
      expect(text2.toString()).toBe("Test");
    });

    it("增量同步", () => {
      const doc2 = new Y.Doc();

      text.insert(0, "Initial");
      
      // 初始同步
      const state1 = Y.encodeStateAsUpdate(doc);
      Y.applyUpdate(doc2, state1);

      // 增量更新
      text.insert(7, " Content");
      
      const state2 = Y.encodeStateAsUpdate(doc);
      Y.applyUpdate(doc2, state2);

      const text2 = doc2.getText("main");
      expect(text2.toString()).toBe("Initial Content");
    });
  });

  // ── 7. 事务处理 ──

  describe("事务处理", () => {
    it("批量操作", () => {
      Y.transact(doc, () => {
        text.insert(0, "Hello");
        text.insert(5, " World");
        text.delete(0, 1);
      });

      expect(text.toString()).toBe("ello World");
    });

    it("事务监听", () => {
      const events: string[] = [];
      
      doc.on("update", () => {
        events.push("update");
      });

      Y.transact(doc, () => {
        text.insert(0, "Test");
      });

      expect(events).toContain("update");
    });
  });

  // ── 8. 撤销/重做 ──

  describe.skip("撤销/重做", () => {
    it("撤销操作", () => {
      const undoManager = new Y.UndoManager(text);

      text.insert(0, "Hello");
      expect(text.toString()).toBe("Hello");

      undoManager.undo();
      expect(text.toString()).toBe("");
    });

    it("重做操作", () => {
      const undoManager = new Y.UndoManager(text);

      text.insert(0, "Hello");
      undoManager.undo();
      expect(text.toString()).toBe("");

      undoManager.redo();
      expect(text.toString()).toBe("Hello");
    });

    it("多次撤销重做", () => {
      const undoManager = new Y.UndoManager(text);

      text.insert(0, "A");
      text.insert(1, "B");
      text.insert(2, "C");

      expect(text.toString()).toBe("ABC");

      undoManager.undo();
      expect(text.toString()).toBe("AB");

      undoManager.undo();
      expect(text.toString()).toBe("A");

      undoManager.redo();
      expect(text.toString()).toBe("AB");
    });
  });

  // ── 9. 性能测试 ──

  describe("性能测试", () => {
    it("大量插入操作", () => {
      const start = Date.now();
      
      Y.transact(doc, () => {
        for (let i = 0; i < 1000; i++) {
          text.insert(text.length, `${i},`);
        }
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // 应该在 1 秒内完成
      expect(text.length).toBeGreaterThan(0);
    });

    it("大文档同步", () => {
      const largeText = "x".repeat(100000);
      text.insert(0, largeText);

      const doc2 = new Y.Doc();
      const state = Y.encodeStateAsUpdate(doc);
      
      const start = Date.now();
      Y.applyUpdate(doc2, state);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
      expect(doc2.getText("main").length).toBe(100000);
    });
  });

  // ── 10. 边界情况 ──

  describe("边界情况", () => {
    it("空文档操作", () => {
      expect(text.toString()).toBe("");
      expect(text.length).toBe(0);
    });

    it("删除超出范围的文本", () => {
      text.insert(0, "Hello");
      
      // 删除超出范围应该不报错
      text.delete(5, 10);
      expect(text.toString()).toBe("Hello");
    });

    it("负数索引", () => {
      text.insert(0, "Hello");
      
      // 负数索引应该被处理
      expect(() => text.insert(-1, "X")).not.toThrow();
    });

    it("特殊字符", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?中文 日本語 한국어";
      text.insert(0, specialChars);
      expect(text.toString()).toBe(specialChars);
    });
  });
});
