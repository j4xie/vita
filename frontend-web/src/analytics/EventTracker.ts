// EventTracker - Analytics event tracking utility
export const EventTracker = {
  track: (event: string, properties?: Record<string, any>) => {
    // Mock implementation for now
    if (__DEV__) {
      console.log('EventTracker:', event, properties);
    }
  },
  
  trackUserAction: (action: string, category?: string) => {
    EventTracker.track('user_action', { action, category });
  },
  
  trackScreenView: (screenName: string) => {
    EventTracker.track('screen_view', { screen_name: screenName });
  }
};

export default EventTracker;