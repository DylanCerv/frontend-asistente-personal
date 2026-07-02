import Svg, { Path } from 'react-native-svg';

type GoogleLogoIconProps = {
  size?: number;
};

export function GoogleLogoIcon({ size = 22 }: GoogleLogoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.3 9.1 3.5l6.8-6.8C35.5 2.6 30.1 0 24 0 14.8 0 7 5.4 3.4 13.3l8 6.2C13 14.3 18.1 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.5 24.5c0-1.5-.1-3-.4-4.5H24v9h12.7c-.6 3.1-2.4 5.7-5 7.4l7.6 5.9c4.4-4.1 7.1-10.3 7.1-17.8z"
      />
      <Path
        fill="#FBBC05"
        d="M11.4 28.5c-1-2.9-1-6.1 0-9l-8-6.2C.8 17 0 20.4 0 24s.8 7 3.4 10.7l8-6.2z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.5 0 12-2.2 16.1-5.9l-7.6-5.9c-2.1 1.4-4.8 2.2-8.5 2.2-5.9 0-11-4-12.8-9.4l-8 6.2C10 42.6 16.5 48 24 48z"
      />
    </Svg>
  );
}
