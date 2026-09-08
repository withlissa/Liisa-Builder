export interface ProjectFile {
  name: string;
  language: string;
  code: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  theme: "dark" | "light";
  thumbnailType: "boomerang" | "dex" | "desk" | "health" | "saas" | "custom";
  stats?: {
    users?: string;
    trades?: string;
    tvl?: string;
    volume?: string;
    stars?: string;
    forks?: string;
  };
  lastEdited: string;
  htmlPreview: string;
  files: ProjectFile[];
  plan?: string[];
  features?: string[];
  suggestedNextSteps?: string[];
}

export type ActiveTab = "projects" | "recent" | "templates";
export type PromptMode = "Plan" | "Build" | "Chat";
export type LeftNavTab = "home" | "search" | "branches" | "feedback" | "apps" | "profile";
export type PreviewDevice = "desktop" | "tablet" | "mobile";
export type EditorView = "preview" | "code" | "split" | "plan";
