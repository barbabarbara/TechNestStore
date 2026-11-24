/** Minimal browser storage and events for Node's built-in test runner. */
export function installBrowserMocks() {
  const entries = new Map();
  const listeners = new Map();
  const events = [];

  globalThis.localStorage = {
    getItem(key) {
      return entries.has(String(key)) ? entries.get(String(key)) : null;
    },
    setItem(key, value) {
      entries.set(String(key), String(value));
    },
    removeItem(key) {
      entries.delete(String(key));
    },
    clear() {
      entries.clear();
    },
  };

  globalThis.Event = class {
    constructor(type) {
      this.type = type;
    }
  };

  globalThis.window = {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    dispatchEvent(event) {
      events.push(event.type);
      for (const listener of listeners.get(event.type) ?? []) listener(event);
      return true;
    },
  };

  return { entries, listeners, events, clear: () => entries.clear() };
}

/** Enough DOM behavior to test buttons and cards without browser dependencies. */
export function installElementMock() {
  class MockElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.dataset = {};
      this.attributes = {};
      this.listeners = new Map();
      this.disabled = false;
      this.hidden = false;
      this.textContent = "";
    }
    append(...elements) {
      this.children.push(...elements);
    }
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }
    getAttribute(name) {
      return this.attributes[name] ?? null;
    }
    addEventListener(type, callback) {
      this.listeners.set(type, callback);
    }
    click() {
      this.listeners.get("click")?.({ type: "click" });
    }
  }
  globalThis.document = {
    createElement: (name) => new MockElement(name),
  };
  return {
    findByClass(root, name) {
      if (root.className?.split(" ").includes(name)) return root;
      for (const child of root.children) {
        const found = this.findByClass(child, name);
        if (found) return found;
      }
      return null;
    },
  };
}
