export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  name: string;
  email: string;
  phone?: string | undefined;
  subject: string;
  message: string;
}

export interface UpdateContactInput {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | null | undefined;
  subject?: string | undefined;
  message?: string | undefined;
  status?: ContactStatus | undefined;
}
