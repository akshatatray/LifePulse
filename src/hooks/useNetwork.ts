/**
 * Network State Hook
 * Monitors network connectivity and provides status to components
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
}

/**
 * Hook to monitor network connectivity
 */
export const useNetwork = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    isWifi: false,
    isCellular: false,
  });

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => unsubscribe();
  }, []);

  const handleNetworkChange = (state: NetInfoState) => {
    setNetworkState({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
    });
  };

  const refresh = useCallback(async () => {
    const state = await NetInfo.refresh();
    handleNetworkChange(state);
    return state;
  }, []);

  return {
    ...networkState,
    refresh,
    isOffline: !networkState.isConnected || networkState.isInternetReachable === false,
  };
};

/**
 * Hook to track sync status
 */
export const useSyncStatus = () => {
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null as number | null,
  });

  // This would be connected to the syncManager in a real implementation
  // For now, it's a placeholder that can be integrated later

  return {
    ...syncState,
    hasPendingChanges: syncState.pendingCount > 0,
  };
};

