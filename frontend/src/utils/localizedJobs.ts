import type { JobItem } from '../types/dashboard';

export function getLocalizedJob(job: JobItem, langCode: string): JobItem {
  if (!job) return job;
  const code = (langCode || 'en').split('-')[0].toLowerCase();
  if (code === 'en' || !job.translations) {
    return job;
  }

  const langContent = job.translations[code] || job.translations[langCode] || job.translations['hi'];
  if (!langContent) {
    return job;
  }

  return {
    ...job,
    serviceName: langContent.serviceName || job.serviceName,
    clientName: langContent.clientName || job.clientName,
    clientAddress: langContent.clientAddress || job.clientAddress,
    scheduledTime: langContent.scheduledTime || job.scheduledTime,
    description: langContent.description || job.description,
    duration: langContent.duration || job.duration,
  };
}

export function getLocalizedJobs(jobs: JobItem[], langCode: string): JobItem[] {
  return jobs.map((job) => getLocalizedJob(job, langCode));
}
