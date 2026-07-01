import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, secureTextEntry, ...props },
  ref,
) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = secureTextEntry === true;

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-subtle dark:text-subtle-dark">{label}</Text>
      <View className="relative">
        <TextInput
          ref={ref}
          placeholderTextColor="#64748B"
          secureTextEntry={isPasswordField && !isPasswordVisible}
          className={`rounded-xl border bg-surface px-4 py-3.5 text-base text-foreground dark:bg-surface-dark dark:text-foreground-dark ${
            isPasswordField ? 'pr-12' : ''
          } ${
            error ? 'border-danger dark:border-danger-dark' : 'border-border dark:border-border-dark'
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
              size={22}
              color="#64748B"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="text-sm text-danger dark:text-danger-dark">{error}</Text>
      ) : null}
    </View>
  );
});
