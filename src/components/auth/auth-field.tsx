import Ionicons from '@react-native-vector-icons/ionicons';
import type { ComponentProps } from 'react';
import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: ComponentProps<typeof Ionicons>['name'];
};

export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  { label, error, className, secureTextEntry, leftIcon, ...props },
  ref,
) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = secureTextEntry === true;

  return (
    <View className="gap-2">
      <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#8A8A8A]">
        {label}
      </Text>
      <View className="relative justify-center">
        {leftIcon ? (
          <View className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 justify-center pl-3.5">
            <Ionicons name={leftIcon} size={18} color="#6B6B6B" />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#5C5C5C"
          secureTextEntry={isPasswordField && !isPasswordVisible}
          className={`rounded-2xl border bg-[#0A0A0A] py-3.5 text-base text-white ${
            leftIcon ? 'pl-11' : 'pl-4'
          } ${isPasswordField ? 'pr-12' : 'pr-4'} ${
            error ? 'border-[#F87171]' : 'border-[#2A2A2A]'
          } ${className ?? ''}`}
          {...props}
        />
        {isPasswordField ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            hitSlop={8}
            className="absolute bottom-0 right-0 top-0 justify-center px-4 active:opacity-60">
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#8A8A8A"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-[#F87171]">{error}</Text> : null}
    </View>
  );
});
