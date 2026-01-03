import { StyleSheet, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, screenPadding } from '../src/theme';

type ContainerProps = {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  withPadding?: boolean;
} & ViewProps;

export const Container = ({
  children,
  edges = ['top', 'bottom'],
  withPadding = true,
  style,
  ...viewProps
}: ContainerProps) => {
  const insets = useSafeAreaInsets();

  const dynamicStyles = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View
      style={[
        styles.container,
        dynamicStyles,
        withPadding && styles.withPadding,
        style,
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  withPadding: {
    paddingHorizontal: screenPadding.horizontal,
  },
});
