import React from 'react';
import { StyleSheet } from 'react-native';

export function LinearGradient({ colors, style, children, ...props }) {
  const gradientColors = colors || ['transparent', 'transparent'];
  const cssGradient = `linear-gradient(to bottom, ${gradientColors.join(', ')})`;

  const flatStyle = StyleSheet.flatten(style) || {};

  const {
    paddingHorizontal,
    paddingVertical,
    marginHorizontal,
    marginVertical,
    elevation,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    ...restStyle
  } = flatStyle;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    ...restStyle,
    background: cssGradient,
  };

  if (paddingHorizontal !== undefined) {
    containerStyle.paddingLeft = containerStyle.paddingLeft || paddingHorizontal;
    containerStyle.paddingRight = containerStyle.paddingRight || paddingHorizontal;
  }
  if (paddingVertical !== undefined) {
    containerStyle.paddingTop = containerStyle.paddingTop || paddingVertical;
    containerStyle.paddingBottom = containerStyle.paddingBottom || paddingVertical;
  }
  if (marginHorizontal !== undefined) {
    containerStyle.marginLeft = containerStyle.marginLeft || marginHorizontal;
    containerStyle.marginRight = containerStyle.marginRight || marginHorizontal;
  }
  if (marginVertical !== undefined) {
    containerStyle.marginTop = containerStyle.marginTop || marginVertical;
    containerStyle.marginBottom = containerStyle.marginBottom || marginVertical;
  }
  if (elevation) {
    containerStyle.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.25)`;
  }
  if (containerStyle.borderWidth && !containerStyle.borderStyle) {
    containerStyle.borderStyle = 'solid';
  }

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
}
