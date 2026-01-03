/**
 * SharedTransition Component
 * Provides shared element transitions between screens
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Dimensions, LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { colors } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SharedElementPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface SharedTransitionContextType {
    registerElement: (id: string, position: SharedElementPosition) => void;
    unregisterElement: (id: string) => void;
    startTransition: (id: string, toPosition: SharedElementPosition) => void;
    endTransition: () => void;
    getPosition: (id: string) => SharedElementPosition | null;
    isTransitioning: boolean;
    activeId: string | null;
}

const SharedTransitionContext = createContext<SharedTransitionContextType | null>(null);

interface SharedTransitionProviderProps {
    children: React.ReactNode;
}

export const SharedTransitionProvider = ({ children }: SharedTransitionProviderProps) => {
    const [elements, setElements] = useState<Map<string, SharedElementPosition>>(new Map());
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const registerElement = useCallback((id: string, position: SharedElementPosition) => {
        setElements((prev) => {
            const next = new Map(prev);
            next.set(id, position);
            return next;
        });
    }, []);

    const unregisterElement = useCallback((id: string) => {
        setElements((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const startTransition = useCallback((id: string, toPosition: SharedElementPosition) => {
        setActiveId(id);
        setIsTransitioning(true);
    }, []);

    const endTransition = useCallback(() => {
        setIsTransitioning(false);
        setActiveId(null);
    }, []);

    const getPosition = useCallback((id: string) => {
        return elements.get(id) || null;
    }, [elements]);

    return (
        <SharedTransitionContext.Provider
            value={{
                registerElement,
                unregisterElement,
                startTransition,
                endTransition,
                getPosition,
                isTransitioning,
                activeId,
            }}
        >
            {children}
        </SharedTransitionContext.Provider>
    );
};

export const useSharedTransition = () => {
    const context = useContext(SharedTransitionContext);
    if (!context) {
        throw new Error('useSharedTransition must be used within SharedTransitionProvider');
    }
    return context;
};

/**
 * Hook to create animated card-to-modal transition
 */
interface UseCardTransitionOptions {
    cardId: string;
    duration?: number;
}

export const useCardTransition = ({
    cardId,
    duration = 300,
}: UseCardTransitionOptions) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);
    const borderRadius = useSharedValue(16);

    const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

    const startExpand = useCallback(() => {
        // Card shrinks slightly then modal appears
        scale.value = withSequence(
            withTiming(0.95, { duration: 100, easing: smoothEasing }),
            withTiming(1, { duration: 200, easing: smoothEasing })
        );
        opacity.value = withTiming(0.5, { duration: 150, easing: smoothEasing });
    }, []);

    const resetCard = useCallback(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(1, { duration: 200 });
    }, []);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
        opacity: opacity.value,
    }));

    return {
        cardAnimatedStyle,
        startExpand,
        resetCard,
    };
};


/**
 * Animated overlay for modal transitions
 */
interface TransitionOverlayProps {
    visible: boolean;
    onHide?: () => void;
    children: React.ReactNode;
}

export const TransitionOverlay = ({
    visible,
    onHide,
    children,
}: TransitionOverlayProps) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const translateY = useSharedValue(50);

    const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

    React.useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 250, easing: smoothEasing });
            scale.value = withSpring(1, { damping: 20, stiffness: 200 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        } else {
            opacity.value = withTiming(0, { duration: 200, easing: smoothEasing });
            scale.value = withTiming(0.95, { duration: 200, easing: smoothEasing });
            translateY.value = withTiming(30, { duration: 200, easing: smoothEasing });
        }
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value * 0.6,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            <Animated.View style={[styles.backdrop, backdropStyle]} />
            <Animated.View style={[styles.content, contentStyle]}>
                {children}
            </Animated.View>
        </View>
    );
};

/**
 * Wrapper component that provides shared element behavior
 */
interface SharedElementProps {
    id: string;
    children: React.ReactNode;
    onLayout?: (layout: LayoutRectangle) => void;
}

export const SharedElement = ({ id, children, onLayout }: SharedElementProps) => {
    const viewRef = useRef<View>(null);
    const { registerElement, unregisterElement } = useSharedTransition();

    const handleLayout = useCallback(() => {
        if (viewRef.current) {
            viewRef.current.measureInWindow((x, y, width, height) => {
                registerElement(id, { x, y, width, height });
                onLayout?.({ x, y, width, height });
            });
        }
    }, [id, registerElement, onLayout]);

    React.useEffect(() => {
        return () => unregisterElement(id);
    }, [id, unregisterElement]);

    return (
        <View ref={viewRef} onLayout={handleLayout} collapsable={false}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background.primary,
    },
    content: {
        flex: 1,
    },
});

