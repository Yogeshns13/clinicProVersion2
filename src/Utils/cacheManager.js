// cacheManager.js - Unified cache manager for all API calls

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class UnifiedCacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheTimestamps = new Map();
  }

  // Generate cache key from API endpoint and parameters
  generateKey(endpoint, params = {}) {
    // Sort params for consistent keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    
    return `${endpoint}_${JSON.stringify(sortedParams)}`;
  }

  // Check if cache is valid for a specific key
  isCacheValid(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    const now = Date.now();
    return (now - timestamp) < CACHE_DURATION;
  }

  // Get cached data
  get(endpoint, params = {}) {
    const key = this.generateKey(endpoint, params);
    
    // Check memory cache first
    if (this.memoryCache.has(key) && this.isCacheValid(key)) {
      console.log(`✓ Cache HIT (memory): ${endpoint}`);
      return this.memoryCache.get(key);
    }

    // Then check localStorage
    if (this.isCacheValid(key)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data = JSON.parse(cached);
          this.memoryCache.set(key, data);
          console.log(`✓ Cache HIT (localStorage): ${endpoint}`);
          return data;
        }
      } catch (err) {
        console.error('Cache read error:', err);
        this.clearKey(key);
      }
    }

    console.log(`✗ Cache MISS: ${endpoint}`);
    return null;
  }

  // Set cache data
  set(endpoint, params = {}, data) {
    const key = this.generateKey(endpoint, params);
    const timestamp = Date.now();
    
    // Update memory cache
    this.memoryCache.set(key, data);
    this.cacheTimestamps.set(key, timestamp);

    // Update localStorage
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(`${key}_timestamp`, timestamp.toString());
      console.log(`✓ Cached: ${endpoint}`);
    } catch (err) {
      console.error('Cache write error:', err);
    }
  }

  // Clear specific cache key
  clearKey(key) {
    this.memoryCache.delete(key);
    this.cacheTimestamps.delete(key);
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
  }

  // Clear cache by endpoint pattern
  clearByEndpoint(endpoint) {
    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(endpoint)) {
        this.clearKey(key);
      }
    }

    // Clear from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(endpoint)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`✓ Cleared cache for: ${endpoint}`);
  }

  // Clear related caches when data is modified
  clearRelated(endpoint) {
    // Define relationships between endpoints
    const relationships = {
      'clinic': ['clinic', 'branch', 'department', 'employee'],
      'branch': ['branch', 'department', 'employee'],
      'department': ['department', 'employee'],
      'employee': ['employee', 'employeeProof', 'employeeBeneficiary', 'employeeShift'],
      'patient': ['patient', 'appointment', 'visit', 'consultation'],
      'appointment': ['appointment', 'slot', 'visit'],
      'slot': ['slot', 'appointment'],
      'shift': ['shift', 'employeeShift'],
      'workday': ['workday', 'employee'],
      'slotconfig': ['slotconfig', 'slot'],
      'visit': ['visit', 'consultation'],
      'consultation': ['consultation']
    };

    // Find which category this endpoint belongs to
    const endpointLower = endpoint.toLowerCase();
    for (const [category, related] of Object.entries(relationships)) {
      if (endpointLower.includes(category)) {
        related.forEach(relatedEndpoint => {
          this.clearByEndpoint(relatedEndpoint);
        });
        break;
      }
    }
  }

  // Clear all cache
  clearAll() {
    this.memoryCache.clear();
    this.cacheTimestamps.clear();
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Only remove cache keys, not user data
      if (key && !['userId', 'profileName', 'clinicID', 'branchID', 'isLoggedIn', 
                     'SESSION_REF', 'fileAccessToken'].includes(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('✓ Cleared all cache');
  }
}

// Export singleton instance
export const apiCache = new UnifiedCacheManager();

// Helper function to wrap API calls with caching
export const withCache = async (
  endpoint, 
  apiFunction, 
  params = {}, 
  options = { forceRefresh: false, skipCache: false }
) => {
  // Skip cache for certain operations
  if (options.skipCache) {
    return await apiFunction();
  }

  // Check cache first (unless force refresh)
  if (!options.forceRefresh) {
    const cached = apiCache.get(endpoint, params);
    if (cached !== null) {
      return cached;
    }
  }

  // Call API and cache result
  const result = await apiFunction();
  apiCache.set(endpoint, params, result);
  return result;
};

// Helper to invalidate cache after mutations
export const invalidateCache = (endpoint) => {
  apiCache.clearRelated(endpoint);
};