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
  status: 'pending' | 'accepted' | 'in_transit' | 'arrived' | 'scheduled' | 'in_progress' | 'completion_pending' | 'completed' | 'declined';
  /** Raw status string from the backend — never collapsed/remapped */
  backendStatus?: string;
  price?: string;
  duration?: string;
  estimatedDuration?: number; // In minutes, e.g. 120 = 2 hours
  isLocationReached?: boolean;
  locationVerified?: boolean;
  beforeWorkPhoto?: string;
  workStarted?: boolean;
  workStartTime?: number; // Timestamp in ms
  completionProofPhoto?: string;
  afterWorkPhoto?: string;
  completedAt?: string;
  completionTime?: number; // Timestamp in ms
  actualWorkDuration?: string; // Formatted duration, e.g. "2 hours 18 minutes"
  sosTriggered?: boolean;
  workCompleted?: boolean;
  completionVerified?: boolean;
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
