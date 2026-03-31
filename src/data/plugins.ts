import { LucideIcon, Bot, Cloud, Shield, Zap, BarChart, MessageSquare, Globe, Cpu, LayoutGrid, CheckCircle2, Phone, Users, UserPlus } from "lucide-react";

export interface Plugin {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    icon: any; // LucideIcon
    category: string;
    isPremium: boolean;
    price?: string;
    usageLimit?: string;
    status: "idle" | "enrolling" | "active";
    badge?: "Essentials" | "Mini" | "Plus" | "Recommended";
}

export const marketplacePlugins: Plugin[] = [
    {
        id: "crm-pro",
        name: "CRM Pro",
        description: "Full-stack customer relationship management with integrated communications.",
        longDescription: "Our premium CRM plugin gives you the power to manage leads via phone calls and SMS directly within the dashboard. Perform inbound/outbound calls and text customers without leaving your workspace.",
        icon: Users,
        category: "CRM",
        isPremium: true,
        price: "$39/mo",
        badge: "Plus",
        status: "idle",
    },
    {
        id: "lead-gen",
        name: "Lead Plugin",
        description: "Automated lead capture via SMS and Phone calls.",
        longDescription: "Give your dealership its own dedicated leads stream. Manage phone call conversions and SMS inquiries in a single unified view designed for management efficiency.",
        icon: UserPlus,
        category: "Marketing",
        isPremium: true,
        price: "$29/mo",
        badge: "Essentials",
        status: "idle",
    },
    {
        id: "bot",
        name: "Bot",
        description: "Add a bot to your customer service.",
        longDescription: "Automate your basic customer queries and lead capture with our intelligent chatbot integration.",
        icon: Bot,
        category: "Crisp Features",
        isPremium: true,
        price: "$19/mo",
        badge: "Essentials",
        status: "idle",
    },
    {
        id: "messenger",
        name: "Messenger",
        description: "Reply to Facebook Messenger messages from your inbox.",
        longDescription: "Consolidate your Facebook communications into a single unified stream for faster response times.",
        icon: MessageSquare,
        category: "Messaging",
        isPremium: true,
        price: "$10/mo",
        badge: "Mini",
        status: "idle",
    },
    {
        id: "triggers",
        name: "Triggers",
        description: "Triggers allow to perform chatbot actions in an automated way.",
        longDescription: "Set up complex 'If This Then That' logic to automate workflows across your dealership ecosystem.",
        icon: Zap,
        category: "Automation",
        isPremium: true,
        price: "$15/mo",
        badge: "Mini",
        status: "idle",
    },
    {
        id: "salesforce",
        name: "Salesforce",
        description: "Sync your contacts between Salesforce and Crisp automatically.",
        longDescription: "Ensure your sales team always has the latest customer data by syncing CRM records in real-time.",
        icon: Cloud,
        category: "CRM",
        isPremium: true,
        price: "$49/mo",
        badge: "Plus",
        status: "idle",
    },
    {
        id: "pipedrive",
        name: "Pipedrive",
        description: "Live Chat and Helpdesk for Pipedrive CRM.",
        longDescription: "Seamlessly integrate your helpdesk tickets and live chat sessions with your Pipedrive pipeline.",
        icon: BarChart,
        category: "CRM",
        isPremium: true,
        price: "$39/mo",
        badge: "Essentials",
        status: "idle",
    },
    {
        id: "zapier",
        name: "Zapier",
        description: "Easy automation for busy people.",
        longDescription: "Connect your dealership app to 5,000+ different tools and automate your entire business stack.",
        icon: Cpu,
        category: "Automation",
        isPremium: true,
        price: "$0/mo",
        badge: "Essentials",
        status: "idle",
    },
    {
        id: "segment",
        name: "Segment",
        description: "Connect Crisp as a source and clip customer data from 200 platforms effortlessly.",
        longDescription: "Aggregate your customer behavioral data into a single source of truth for advanced marketing analysis.",
        icon: Globe,
        category: "Automation",
        isPremium: true,
        price: "$25/mo",
        badge: "Essentials",
        status: "idle",
    },
    {
        id: "auto-responder",
        name: "Auto-Responder",
        description: "Send automatic messages based on customer channels.",
        longDescription: "Create personalized automated greeting messages for email, web, and mobile visitors based on their source.",
        icon: LayoutGrid,
        category: "Crisp Features",
        isPremium: true,
        price: "$12/mo",
        badge: "Mini",
        status: "idle",
    },
];

export const CATEGORIES = [
    { id: "all", name: "All Plugins", count: 31 },
    { id: "installed", name: "Installed Plugins", count: 3 },
    { id: "Crisp Features", name: "Crisp Features", count: 21 },
    { id: "Automation", name: "Automation", count: 20 },
    { id: "CMS", name: "CMS", count: 10 },
    { id: "CRM", name: "CRM", count: 18 },
    { id: "Marketing", name: "Marketing", count: 7 },
    { id: "Messaging", name: "Messaging", count: 12 },
    { id: "Teamwork", name: "Teamwork", count: 10 },
    { id: "Others", name: "Others", count: 17 },
];
