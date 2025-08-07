class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = new Set();
    }
    this.events[eventName].add(callback);
  }

  unsubscribe(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName].delete(callback);
    }
  }

  publish(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event bus callback for event: ${eventName}`, error);
        }
      });
    }
  }
}


export const eventBus = new EventBus();