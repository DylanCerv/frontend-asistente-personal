import { apiRequest } from '../api/api-client';

export async function deleteJob(jobId: string): Promise<void> {
  await apiRequest(`/jobs/${jobId}`, { method: 'DELETE' });
}
