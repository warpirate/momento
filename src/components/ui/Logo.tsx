import React from 'react';
import { Image, ImageStyle, ViewStyle } from 'react-native';
import { logos, logoSizes } from '../../../assets/logos';

interface LogoProps {
  size?: keyof typeof logoSizes | number;
  variant?: 'appLogo' | 'appLogoSmall' | 'appLogoTiny' | 'placeholder';
  style?: ImageStyle;
  containerStyle?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'large', // Changed from 'medium' to 'large' for better visibility
  variant = 'appLogo',
  style,
  containerStyle,
}) => {
  const logoSize = typeof size === 'string' ? logoSizes[size] : size;
  
  return (
    <Image
      source={logos[variant]}
      style={[
        {
          width: logoSize,
          height: logoSize,
          resizeMode: 'contain',
        },
        style,
      ]}
    />
  );
};
