import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
};

type UIState = {
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  toast: {
    visible: false,
    message: '',
    type: 'info'
  },
  showToast: (message, type = 'info') =>
    set({
      toast: {
        visible: true,
        message,
        type
      }
    }),
  hideToast: () =>
    set((state) => ({
      toast: {
        ...state.toast,
        visible: false
      }
    }))
}));
