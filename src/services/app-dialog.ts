export type AppDialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AppDialogPayload = {
  title: string;
  message?: string;
  buttons?: AppDialogButton[];
};

type DialogListener = (payload: AppDialogPayload) => void;

let listener: DialogListener | null = null;

export function setAppDialogListener(nextListener: DialogListener | null) {
  listener = nextListener;
}

export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AppDialogButton[],
) {
  listener?.({
    title,
    message,
    buttons,
  });
}
