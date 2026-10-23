import {
  Eye,
  Gauge,
  CircleDot,
  Focus,
  Flame,
  Brain,
  Baby,
  Droplets,
  TriangleAlert,
  Glasses,
  Stethoscope,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";

const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  "retina-und-glaskorper": Eye,
  glaukom: Gauge,
  "katarakt-und-intraokularlinsen": CircleDot,
  "hornhaut-und-aussere-augenerkrankungen": Focus,
  uveitis: Flame,
  neuroophthalmologie: Brain,
  "kinderophthalmologie-und-strabologie": Baby,
  "lider-tranenwege-und-orbita": Droplets,
  "augenverletzungen-und-notfalle": TriangleAlert,
  "refraktion-und-optik": Glasses,
  "allgemeine-augenheilkunde": Stethoscope,
  "diagnostik-und-bildgebung": ScanSearch,
};

export function getSpecialtyIcon(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? Eye;
}
