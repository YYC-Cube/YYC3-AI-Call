import { renderHook, act } from "@testing-library/react";
import { useAI } from "@/lib/hooks/useAI";

describe("useAI hook", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    (global.fetch as any)?.mockReset?.();
  });

  it("chat resolves data and calls onSuccess", async () => {
    const fake = {
      choices: [{ message: { role: "assistant", content: "hi" } }],
    };
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => fake });

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useAI({ onSuccess }));

    const data = await act(async () => {
      return await result.current.chat([
        { role: "user", content: "hello" },
      ]);
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("chat throws on non-OK response and calls onError", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "bad" }),
    });

    const onError = jest.fn();
    const { result } = renderHook(() => useAI({ onError }));

    await act(async () => {
      try {
        await result.current.chat([{ role: "user", content: "hello" }]);
      } catch {}
    });

    expect(onError).toHaveBeenCalled();
  });
});
