
// Runtime configuration that can be updated after build
interface RuntimeConfig {
  VITE_API_URL: string;
  VITE_WS_URL: string;
}

// Check if runtime config exists (injected by docker-entrypoint.sh)
const getRuntimeConfig = (): RuntimeConfig => {
  // Try to get runtime config from window object (injected at startup)
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) {
    const config = (window as any).__RUNTIME_CONFIG__;
    console.log('Using runtime configuration:', config);
    return config;
  }
  
  // Fallback to Vite environment variables for development
  const fallbackConfig = {
    VITE_API_URL: import.meta.env.VITE_API_URL || '/api',
    VITE_WS_URL: import.meta.env.VITE_WS_URL || 
      `${window?.location?.protocol === 'https:' ? 'wss:' : 'ws:'}//${window?.location?.host}`
  };
  
  console.log('Using fallback configuration:', fallbackConfig);
  return fallbackConfig;
};

export const runtimeConfig = getRuntimeConfig();

// Add connection health check
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${runtimeConfig.VITE_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('Backend health check response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};
