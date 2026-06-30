import { Text, TextInput, View, type TextInputProps } from 'react-native';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-subtle dark:text-subtle-dark">{label}</Text>
      <TextInput
        placeholderTextColor="#64748B"
        className={`rounded-xl border bg-surface px-4 py-3.5 text-base text-foreground dark:bg-surface-dark dark:text-foreground-dark ${
          error ? 'border-danger dark:border-danger-dark' : 'border-border dark:border-border-dark'
        } ${className ?? ''}`}
        {...props}
      />
      {error ? (
        <Text className="text-sm text-danger dark:text-danger-dark">{error}</Text>
      ) : null}
    </View>
  );
}
