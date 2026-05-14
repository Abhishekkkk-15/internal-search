import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NexusState {
  // Navigation State
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;

  // Header / Org switch
  currentOrg: string;
  setOrg: (org: string) => void;

  // Theme State
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Model & Tools Settings
  llmProvider: 'openai' | 'anthropic' | 'local';
  setLlmProvider: (provider: 'openai' | 'anthropic' | 'local') => void;
  apiKey: string;
  setApiKey: (key: string) => void;

  toolsEnabled: {
    jira: boolean;
    slack: boolean;
    notion: boolean;
  };
  toggleTool: (tool: 'jira' | 'slack' | 'notion') => void;

  // Memory Settings
  retentionDays: number;
  setRetentionDays: (days: number) => void;
}

export const useNexusStore = create<NexusState>()(
  persist(
    (set) => ({
      sidebarExpanded: true,
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

      currentOrg: 'Acme Corp (Enterprise)',
      setOrg: (org) => set({ currentOrg: org }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      llmProvider: 'openai',
      setLlmProvider: (provider) => set({ llmProvider: provider }),
      apiKey: 'sk-mock-key-nexus-assistant-v2',
      setApiKey: (apiKey) => set({ apiKey }),

      toolsEnabled: {
        jira: true,
        slack: true,
        notion: false,
      },
      toggleTool: (tool) =>
        set((state) => ({
          toolsEnabled: {
            ...state.toolsEnabled,
            [tool]: !state.toolsEnabled[tool],
          },
        })),

      retentionDays: 30,
      setRetentionDays: (days) => set({ retentionDays: days }),
    }),
    {
      name: 'nexus-assistant-storage',
    }
  )
);
