import SSEService from '../../src/services/sseService';

describe('SSEService', () => {
  let originalEventSource;

  beforeEach(() => {
    originalEventSource = global.EventSource;
  });

  afterEach(() => {
    global.EventSource = originalEventSource;
    // ensure disconnected
    SSEService.disconnect();
  });

  it('connects and receives messages', () => {
    return new Promise((resolve, reject) => {
    // Minimal mock EventSource
    class MockES {
      constructor(url) {
        this.url = url;
        this.readyState = 0;
        setTimeout(() => {
          this.readyState = 1; // OPEN
          if (this.onopen) this.onopen();
        }, 0);
      }
      close() {
        this.readyState = 2;
      }
      // helper to simulate message
      push(data) {
        if (this.onmessage) this.onmessage({ data });
      }
      simulateError(err) {
        if (this.onerror) this.onerror(err);
      }
    }

    let created;
    // wrap MockES to capture instance
    class CapturingMockES extends MockES {
      constructor(url) {
        super(url);
        created = this;
      }
    }

    global.EventSource = CapturingMockES;

      SSEService.connect(42, (event) => {
        try {
          expect(event.data).toBe('hello');
          resolve();
        } catch (err) {
          reject(err);
        }
      }, () => {});

    // wait a tick then push a message on the captured instance
    setTimeout(() => {
      if (created && typeof created.push === 'function') {
        created.push('hello');
      } else if (SSEService.eventSource && typeof SSEService.eventSource.push === 'function') {
        SSEService.eventSource.push('hello');
      } else {
        reject(new Error('No EventSource instance to push message'));
      }
    }, 10);
    });
  });

  it('handles error and reconnect attempts', (done) => {
    class MockES2 {
      constructor() {
        this.readyState = 2; // closed
        setTimeout(() => {
          if (this.onerror) this.onerror({ msg: 'closed' });
        }, 0);
      }
      close() {}
    }

    global.EventSource = MockES2;

    // Provide an onError to observe
    SSEService.maxReconnectAttempts = 1; // shorten test
    SSEService.connect(7, () => {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});
