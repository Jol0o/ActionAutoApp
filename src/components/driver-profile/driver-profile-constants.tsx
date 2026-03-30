import { OnlineStatus } from '@/types/user';
import { TrailerType, OperationalStatus, ComplianceDocumentType } from '@/types/driver-profile';

export const driverStatusOptions: { value: OnlineStatus; label: string; color: string; description: string }[] = [
    { value: 'online', label: 'Available', color: 'bg-green-500', description: 'Ready for assignments' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500', description: 'Temporarily unavailable' },
    { value: 'busy', label: 'On Delivery', color: 'bg-blue-500', description: 'Currently on a delivery' },
    { value: 'do_not_disturb', label: 'Off Duty', color: 'bg-red-500', description: 'Not accepting assignments' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-500', description: 'Not working' },
];

export const trailerTypeOptions: { value: TrailerType; label: string; description: string; capacity: string; category: string; emoji: string }[] = [
    { value: 'open_3car_wedge', label: 'Open 3-Car Wedge', description: 'Standard open auto hauler with wedge design', capacity: '3 vehicles', category: 'open', emoji: '🚛' },
    { value: 'open_2car', label: 'Open 2-Car', description: 'Compact open trailer for 2 vehicles', capacity: '2 vehicles', category: 'open', emoji: '🚚' },
    { value: '5car_open', label: '5-Car Open', description: 'Mid-size open auto hauler', capacity: '5 vehicles', category: 'open', emoji: '🚛' },
    { value: 'enclosed_2car', label: 'Enclosed 2-Car', description: 'Fully enclosed protection for premium vehicles', capacity: '2 vehicles', category: 'enclosed', emoji: '📦' },
    { value: 'enclosed_3car', label: 'Enclosed 3-Car', description: 'Larger enclosed for high-value transport', capacity: '3 vehicles', category: 'enclosed', emoji: '📦' },
    { value: 'flatbed', label: 'Flatbed', description: 'Open flat platform for heavy or oversized loads', capacity: '1-2 vehicles', category: 'flatbed', emoji: '🔲' },
    { value: 'dually_flatbed', label: 'Dually Flatbed', description: 'Dually truck with flatbed configuration', capacity: '1-2 vehicles', category: 'flatbed', emoji: '🔲' },
    { value: 'hotshot', label: 'Hotshot', description: 'Pickup truck with gooseneck for quick hauls', capacity: '1-3 vehicles', category: 'specialty', emoji: '⚡' },
    { value: 'gooseneck', label: 'Gooseneck', description: 'Gooseneck hitch auto trailer', capacity: '2-4 vehicles', category: 'specialty', emoji: '🔗' },
    { value: 'lowboy', label: 'Lowboy', description: 'Ultra-low profile for tall/heavy machinery', capacity: '1-2 vehicles', category: 'heavy', emoji: '⬇️' },
    { value: 'step_deck', label: 'Step Deck', description: 'Two-level for height clearance flexibility', capacity: '1-3 vehicles', category: 'heavy', emoji: '📐' },
    { value: 'rgn', label: 'RGN (Removable Gooseneck)', description: 'Detachable gooseneck for heavy/oversized loads', capacity: '1 vehicle', category: 'heavy', emoji: '🏗️' },
    { value: 'double_drop', label: 'Double Drop', description: 'Extended low-deck for tall, heavy cargo', capacity: '1-2 vehicles', category: 'heavy', emoji: '⬇️' },
    { value: '9car_stinger', label: '9-Car Stinger', description: 'Full-size commercial 9-car auto hauler', capacity: '9 vehicles', category: 'multi', emoji: '🏢' },
    { value: '7car_stinger', label: '7-Car Stinger', description: 'Commercial 7-car hauler', capacity: '7 vehicles', category: 'multi', emoji: '🏢' },
    { value: 'power_only', label: 'Power Only', description: 'Cab only — pull customer-provided trailer', capacity: 'Varies', category: 'specialty', emoji: '🔌' },
    { value: 'other', label: 'Other', description: 'Custom or unlisted trailer configuration', capacity: 'Varies', category: 'specialty', emoji: '🔧' },
];

export const TRAILER_CATEGORIES = [
    { id: 'open', label: 'Open Trailers', color: 'emerald', gradient: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500', icon: '🟢' },
    { id: 'enclosed', label: 'Enclosed Trailers', color: 'blue', gradient: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500', icon: '🔵' },
    { id: 'flatbed', label: 'Flatbed', color: 'amber', gradient: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500', icon: '🟡' },
    { id: 'heavy', label: 'Heavy Duty', color: 'red', gradient: 'from-red-500/10 to-rose-500/10', border: 'border-red-500', icon: '🔴' },
    { id: 'multi', label: 'Multi-Car Haulers', color: 'purple', gradient: 'from-purple-500/10 to-violet-500/10', border: 'border-purple-500', icon: '🟣' },
    { id: 'specialty', label: 'Specialty', color: 'cyan', gradient: 'from-cyan-500/10 to-sky-500/10', border: 'border-cyan-500', icon: '🔷' },
];

export const operationalStatusOptions: { value: OperationalStatus; label: string; color: string; description: string }[] = [
    { value: 'active', label: 'Active', color: 'bg-emerald-500', description: 'Available for dispatch' },
    { value: 'on_leave', label: 'On Leave', color: 'bg-amber-500', description: 'Temporarily off duty' },
    { value: 'maintenance', label: 'In Shop / Maintenance', color: 'bg-orange-500', description: 'Vehicle under maintenance' },
    { value: 'terminated', label: 'Terminated', color: 'bg-red-500', description: 'No longer active' },
];

export const documentTypeOptions: { value: ComplianceDocumentType; label: string }[] = [
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'medical_card', label: 'Medical Card (DOT Physical)' },
    { value: 'insurance_certificate', label: 'Insurance Certificate' },
    { value: 'vehicle_registration', label: 'Vehicle Registration' },
    { value: 'dot_inspection', label: 'DOT Inspection Report' },
    { value: 'w9_form', label: 'W-9 Form' },
    { value: 'operating_authority', label: 'Operating Authority' },
    { value: 'cargo_insurance', label: 'Cargo Insurance' },
    { value: 'liability_insurance', label: 'Liability Insurance' },
    { value: 'other', label: 'Other' },
];

export const REQUIRED_DOCUMENTS: { type: ComplianceDocumentType; label: string; required: boolean; description: string; icon: string }[] = [
    { type: 'drivers_license', label: "Commercial Driver's License (CDL)", required: true, description: 'Valid CDL — front and back required', icon: '🪪' },
    { type: 'medical_card', label: 'DOT Medical Card', required: true, description: 'Current DOT physical examination certificate', icon: '🏥' },
    { type: 'insurance_certificate', label: 'Auto Liability Insurance', required: true, description: 'Proof of auto liability coverage', icon: '🛡️' },
    { type: 'vehicle_registration', label: 'Vehicle Registration', required: true, description: 'Current registration for truck and trailer', icon: '📋' },
    { type: 'operating_authority', label: 'Operating Authority (MC/DOT)', required: true, description: 'FMCSA operating authority documentation', icon: '📜' },
    { type: 'w9_form', label: 'W-9 Tax Form', required: true, description: 'IRS Form W-9 for tax reporting', icon: '📄' },
    { type: 'cargo_insurance', label: 'Cargo Insurance', required: false, description: 'Coverage for transported cargo', icon: '📦' },
    { type: 'liability_insurance', label: 'General Liability Insurance', required: false, description: 'General liability coverage', icon: '🔒' },
    { type: 'dot_inspection', label: 'DOT Inspection Report', required: false, description: 'Most recent DOT vehicle inspection', icon: '🔍' },
];

export const specialFeatureOptions = [
    { value: 'lift_gate', label: 'Lift Gate', icon: '⬆️' },
    { value: 'winch', label: 'Winch', icon: '🔄' },
    { value: 'enclosed', label: 'Enclosed', icon: '📦' },
    { value: 'air_ride', label: 'Air Ride Suspension', icon: '💨' },
    { value: 'gps_tracking', label: 'GPS Tracking', icon: '📡' },
    { value: 'eld_equipped', label: 'ELD Equipped', icon: '📟' },
    { value: 'hazmat_certified', label: 'HAZMAT Certified', icon: '☢️' },
    { value: 'oversized_capable', label: 'Oversized Capable', icon: '📏' },
    { value: 'inoperable_vehicle_capable', label: 'Inoperable Vehicle Capable', icon: '🔧' },
    { value: 'tarping', label: 'Tarping Available', icon: '🏕️' },
    { value: 'chains_straps', label: 'Chains & Straps', icon: '⛓️' },
    { value: 'wheel_nets', label: 'Wheel Nets', icon: '🕸️' },
    { value: 'ramps', label: 'Loading Ramps', icon: '📐' },
    { value: 'dolly', label: 'Dolly / Go-Jack', icon: '🛞' },
];

export const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export const AVAILABLE_DAYS = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
];
