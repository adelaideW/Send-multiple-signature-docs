
export interface Employee {
  id: string;
  name: string;
  avatar: string;
  status: 'Active' | 'Inactive' | 'Onboarding';
  role: string;
  employmentType: string;
  department: string;
  workLocation: string;
  workEmail: string;
  startDate: string;
  manager: string;
  ein: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  status?: 'Default' | 'Signed' | 'Expired' | 'Pending';
  dateSigned?: string;
  lastModified: string;
  children?: DocumentItem[];
}

export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
}

/** Mock uploaded file with distinct preview content for the envelope creator */
export interface UploadedFileItem {
  id: string;
  name: string;
  previewTitle: string;
  previewParagraphs: string[];
}
