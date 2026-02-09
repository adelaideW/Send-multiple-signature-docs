
import React from 'react';
import { 
  User, Shield, Clipboard, RefreshCw, Users, Handshake, 
  BarChart, CheckSquare, Search, FileText, CreditCard, 
  Umbrella, LayoutGrid, Smartphone, Lock, Key, DollarSign, 
  BookOpen, HeartHandshake, Briefcase, Settings, HelpCircle, 
  Accessibility, Layout, Bell, Grid, Plus
} from 'lucide-react';

export const PRIMARY_PURPLE = '#7A005D';

export const SIDEBAR_ITEMS = [
  { id: 'employee-info', label: 'Employee information' },
  { id: 'personal', label: 'Personal information' },
  { id: 'additional', label: 'Additional information' },
  { id: 'hierarchy', label: 'Hierarchy information' },
  { id: 'partners', label: 'Business partners' },
  { id: 'compensation', label: 'Compensation information' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'direct-reports', label: 'Direct Reports' },
  { id: 'custom-fields', label: 'Custom fields' },
  { id: 'documents', label: 'Documents', active: true },
  { id: 'payroll', label: 'Payroll' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'commuter', label: 'Commuter' },
  { id: 'apps', label: 'Apps' },
  { id: 'usernames', label: 'App usernames' },
  { id: 'devices', label: 'Devices' },
  { id: 'two-factor', label: 'Two factor devices' },
  { id: 'authentication', label: 'Authentication' },
];

export const MOCK_EMPLOYEE = {
  id: '1',
  name: 'Kale George',
  avatar: 'https://i.pravatar.cc/150?u=kale',
  status: 'Active' as const,
  role: 'Product Manager',
  employmentType: 'Salaried, full-time',
  department: 'Human resources',
  workLocation: 'San Francisco',
  workEmail: 'admin@rippling.com',
  startDate: '12/01/2022',
  manager: 'Ann Ekstrom Bothman',
  ein: '-'
};

export const MOCK_DOCUMENTS = [
  { id: 'd1', name: 'Notices', type: 'folder', status: 'Default', lastModified: '09/26/2025' },
  { id: 'd2', name: 'Confidential documents', type: 'folder', status: 'Default', lastModified: '09/26/2025' },
];

export const MOCK_ENVELOPES = [
  { 
    id: 'e1', 
    name: '[Envelope Name]', 
    status: 'Yet to sign', 
    lastModified: '01/13/25 14:47:21 PST', 
    employee: { name: 'Jane Cooper', avatar: 'https://i.pravatar.cc/150?u=jane' },
    recipient: { name: 'Richard Satherland', avatar: 'https://i.pravatar.cc/150?u=richard' }
  },
  { 
    id: 'e2', 
    name: '[Envelope Name]', 
    status: 'Signed', 
    lastModified: '01/13/25 14:47:21 PST', 
    employee: { name: 'Jerome Bell', avatar: 'https://i.pravatar.cc/150?u=jerome' },
    recipient: { name: 'Richard Satherland', avatar: 'https://i.pravatar.cc/150?u=richard' }
  },
];
