export interface JobItem {
  id: string;
  serviceName: string;
  serviceImage: string;
  image: string; // for compatibility
  clientName: string;
  clientImage: string;
  clientAddress: string;
  clientPhone?: string;
  scheduledTime: string;
  date: string;
  description: string;
  customerPhotos: string[];
  latitude: number;
  longitude: number;
  status: 'accepted' | 'scheduled' | 'in_progress' | 'completed' | 'declined';
  price?: string;
  duration?: string;
  isLocationReached?: boolean;
  translations?: Record<string, {
    serviceName?: string;
    clientName?: string;
    clientAddress?: string;
    scheduledTime?: string;
    description?: string;
    duration?: string;
  }>;
}

export type NavTab = 'home' | 'orders' | 'voice' | 'account';
