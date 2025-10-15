import ApiService from "../../src/services/api";

describe("ApiService (smoke)", () => {
  afterEach(() => {
    // reset global fetch mock
    if (global.fetch && global.fetch.mockRestore) global.fetch.mockRestore();
    global.fetch = undefined;
    // clear localStorage
    try {
      localStorage.clear();
    } catch (e) {}
  });

  it("login - success stores user and returns data", async () => {
    const mockResponse = { id: 1, email: "a@b.com", token: "tok" };
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) })
    );

    const res = await ApiService.login("a@b.com", "pw");
    expect(res).toEqual(mockResponse);
    const stored = JSON.parse(localStorage.getItem("currentUser") || "null");
    expect(stored).toMatchObject(mockResponse);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("login - failure throws with server detail", async () => {
    const mockErr = { detail: "Invalid credentials" };
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve(mockErr) })
    );

    await expect(ApiService.login("x@x.com", "bad")).rejects.toThrow(
      /Invalid credentials/
    );
  });

  it("getPaymentHistory - returns JSON on success", async () => {
    const hist = { payment_history: [{ id: 1, amount: 10 }] };
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(hist) })
    );

    const res = await ApiService.getPaymentHistory(123);
    expect(res).toEqual(hist);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payment-history/123"),
      expect.any(Object)
    );
  });
});
