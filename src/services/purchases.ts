/**
 * LifePulse - Purchases Service
 * RevenueCat integration hooks (scaffolding for Phase 4)
 *
 * This file prepares the interface for RevenueCat integration.
 * Actual RevenueCat SDK integration will be added in Phase 4.
 */

import { usePremiumStore } from '../stores/premiumStore';

// RevenueCat Product IDs (to be configured in RevenueCat dashboard)
export const PRODUCT_IDS = {
    PRO_MONTHLY: 'lifepulse_pro_monthly',
    PRO_YEARLY: 'lifepulse_pro_yearly',
    LIFETIME: 'lifepulse_lifetime',
} as const;

// RevenueCat Entitlement IDs
export const ENTITLEMENT_IDS = {
    PRO: 'pro',
    LIFETIME: 'lifetime',
} as const;

// Product interface (matches RevenueCat structure)
export interface Product {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice?: {
        price: number;
        priceString: string;
        cycles: number;
        period: string;
        periodUnit: string;
        periodNumberOfUnits: number;
    };
}

// Purchase result interface
export interface PurchaseResult {
    success: boolean;
    entitlements?: string[];
    error?: string;
}

// Customer info interface
export interface CustomerInfo {
    entitlements: {
        active: Record<string, {
            identifier: string;
            isActive: boolean;
            willRenew: boolean;
            periodType: string;
            latestPurchaseDate: string;
            expirationDate: string | null;
        }>;
    };
    originalPurchaseDate: string | null;
    firstSeen: string;
}

/**
 * Initialize RevenueCat SDK
 * Called once at app startup
 */
export const initializePurchases = async (): Promise<void> => {
    // TODO: Phase 4 - Initialize RevenueCat SDK
    // import Purchases from 'react-native-purchases';
    // Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    console.log('[Purchases] RevenueCat initialization scaffolded');
};

/**
 * Get available products for purchase
 */
export const getProducts = async (): Promise<Product[]> => {
    // TODO: Phase 4 - Fetch products from RevenueCat
    // const products = await Purchases.getProducts([...Object.values(PRODUCT_IDS)]);
    // return products;

    // Mock products for now
    return [
        {
            identifier: PRODUCT_IDS.PRO_MONTHLY,
            title: 'Pro Monthly',
            description: 'LifePulse Pro - Monthly subscription',
            price: 4.99,
            priceString: '$4.99',
            currencyCode: 'USD',
        },
        {
            identifier: PRODUCT_IDS.PRO_YEARLY,
            title: 'Pro Yearly',
            description: 'LifePulse Pro - Yearly subscription (save 33%)',
            price: 39.99,
            priceString: '$39.99',
            currencyCode: 'USD',
        },
        {
            identifier: PRODUCT_IDS.LIFETIME,
            title: 'Lifetime',
            description: 'LifePulse Pro - Lifetime access',
            price: 79.99,
            priceString: '$79.99',
            currencyCode: 'USD',
        },
    ];
};

/**
 * Purchase a product
 */
export const purchaseProduct = async (productId: string): Promise<PurchaseResult> => {
    // TODO: Phase 4 - Process purchase through RevenueCat
    // try {
    //     const { customerInfo } = await Purchases.purchaseProduct(productId);
    //     const entitlements = Object.keys(customerInfo.entitlements.active);
    //     return { success: true, entitlements };
    // } catch (error) {
    //     return { success: false, error: error.message };
    // }

    console.log(`[Purchases] Mock purchase for ${productId}`);

    // Mock successful purchase
    return {
        success: true,
        entitlements: [ENTITLEMENT_IDS.PRO],
    };
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<PurchaseResult> => {
    // TODO: Phase 4 - Restore purchases through RevenueCat
    // try {
    //     const customerInfo = await Purchases.restorePurchases();
    //     const entitlements = Object.keys(customerInfo.entitlements.active);
    //     return { success: true, entitlements };
    // } catch (error) {
    //     return { success: false, error: error.message };
    // }

    console.log('[Purchases] Mock restore purchases');

    return {
        success: true,
        entitlements: [],
    };
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
    // TODO: Phase 4 - Get customer info from RevenueCat
    // const customerInfo = await Purchases.getCustomerInfo();
    // return customerInfo;

    return null;
};

/**
 * Check if user has active entitlement
 */
export const hasEntitlement = async (entitlementId: string): Promise<boolean> => {
    // TODO: Phase 4 - Check entitlement through RevenueCat
    // const customerInfo = await Purchases.getCustomerInfo();
    // return !!customerInfo.entitlements.active[entitlementId];

    const { tier } = usePremiumStore.getState();
    if (entitlementId === ENTITLEMENT_IDS.LIFETIME) {
        return tier === 'lifetime';
    }
    if (entitlementId === ENTITLEMENT_IDS.PRO) {
        return tier === 'pro' || tier === 'lifetime';
    }
    return false;
};

/**
 * Sync subscription state with RevenueCat
 * Call this on app launch and after purchases
 */
export const syncSubscriptionState = async (): Promise<void> => {
    // TODO: Phase 4 - Sync with RevenueCat
    // const customerInfo = await Purchases.getCustomerInfo();
    // const { subscribe, cancelSubscription } = usePremiumStore.getState();
    //
    // if (customerInfo.entitlements.active[ENTITLEMENT_IDS.LIFETIME]) {
    //     subscribe('lifetime');
    // } else if (customerInfo.entitlements.active[ENTITLEMENT_IDS.PRO]) {
    //     const entitlement = customerInfo.entitlements.active[ENTITLEMENT_IDS.PRO];
    //     subscribe('pro', entitlement.expirationDate);
    // } else {
    //     cancelSubscription();
    // }

    console.log('[Purchases] Mock sync subscription state');
};

/**
 * Hook for managing purchases in components
 */
export const usePurchases = () => {
    const { subscribe, tier, isPro, isLifetime, startTrial, hasUsedTrial } = usePremiumStore();

    const purchase = async (productId: string): Promise<boolean> => {
        const result = await purchaseProduct(productId);

        if (result.success) {
            // Determine tier from product
            if (productId === PRODUCT_IDS.LIFETIME) {
                subscribe('lifetime');
            } else {
                // Calculate expiry (mock: 30 days for monthly, 365 for yearly)
                const isYearly = productId === PRODUCT_IDS.PRO_YEARLY;
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + (isYearly ? 365 : 30));
                subscribe('pro', expiryDate.toISOString());
            }
            return true;
        }

        return false;
    };

    const restore = async (): Promise<boolean> => {
        const result = await restorePurchases();
        if (result.success && result.entitlements && result.entitlements.length > 0) {
            await syncSubscriptionState();
            return true;
        }
        return false;
    };

    return {
        purchase,
        restore,
        tier,
        isPro: isPro(),
        isLifetime: isLifetime(),
        startTrial,
        hasUsedTrial,
    };
};

