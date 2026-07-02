import type { JobStatus } from '@/types/audio-job';

export function getStatusMessage(status: JobStatus, progress: number): string {
  if (status === 'pending') return 'Procesando...';
  if (status === 'processing') {
    if (progress < 25) return 'Transcribiendo...';
    if (progress < 50) return 'Analizando...';
    if (progress < 75) return 'Organizando...';
    return 'Guardando...';
  }
  if (status === 'completed') return 'Listo';
  if (status === 'failed') return 'Error al procesar';
  return 'Procesando...';
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return 'Tardó demasiado, intenta de nuevo';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Sin conexión. Revisa tu red e intenta de nuevo';
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado';
}
