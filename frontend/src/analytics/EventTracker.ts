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
  },

  trackActivityEvent: (action: string, activityId: string, properties?: Record<string, any>) => {
    EventTracker.track('activity_event', { action, activity_id: activityId, ...properties });
  }
};

// Export analytics instance and Events for compatibility
export const analytics = EventTracker;
export const Events = {
  ACTIVITY_PRESS: 'activity_press',
  ACTIVITY_SHARE: 'activity_share',
  ACTIVITY_BOOKMARK: 'activity_bookmark',
  ACTIVITY_VIEW: 'activity_view'
};

export default EventTracker;