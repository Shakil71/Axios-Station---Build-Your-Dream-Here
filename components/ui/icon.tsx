import {
  Activity, BarChart3, Boxes, Bot, BrainCircuit, Briefcase, Building2, Cloud, Code2, Compass, Cpu, Database, Factory,
  GitBranch, Globe, GraduationCap, Gauge, HeartPulse, Hotel, IdCard, Landmark, Layers, LineChart, Lock, Network,
  Puzzle, Rocket, ScanBarcode, ServerCog, ShieldCheck, ShoppingBag, Smartphone, Sparkles, TrendingUp, Truck, Users,
  Workflow, Zap, type LucideIcon,
} from "lucide-react";

/** Curated icon registry so the CMS can reference icons by name without shipping all of lucide. */
export const ICONS: Record<string, LucideIcon> = {
  Activity, BarChart3, Boxes, Bot, BrainCircuit, Briefcase, Building2, Cloud, Code2, Compass, Cpu, Database, Factory,
  GitBranch, Globe, GraduationCap, Gauge, HeartPulse, Hotel, IdCard, Landmark, Layers, LineChart, Lock, Network,
  Puzzle, Rocket, ScanBarcode, ServerCog, ShieldCheck, ShoppingBag, Smartphone, Sparkles, TrendingUp, Truck, Users,
  Workflow, Zap,
};

export const ICON_NAMES = Object.keys(ICONS).sort();

export function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden />;
}
