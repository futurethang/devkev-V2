// Utility functions for content management

export function filterMockContent<T extends { mock?: boolean }>(
  items: T[],
  showMock: boolean = process.env.NODE_ENV === 'development'
): T[] {
  if (showMock) {
    return items;
  }
  return items.filter(item => !item.mock);
}

// Helper to check if we should show mock content
export function shouldShowMock(): boolean {
  // In development, always show mock content
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, check for a query parameter or environment variable
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('showMock') === 'true';
  }
  
  return process.env.SHOW_MOCK_CONTENT === 'true';
}