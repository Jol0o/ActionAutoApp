import { OnlineStatus } from '@/types/user';
import { TrailerType, OperationalStatus, ComplianceDocumentType } from '@/types/driver-profile';

export const driverStatusOptions: { value: OnlineStatus; label: string; color: string; description: string }[] = [
    { value: 'online', label: 'Available', color: 'bg-green-500', description: 'Ready for assignments' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500', description: 'Temporarily unavailable' },
    { value: 'busy', label: 'On Delivery', color: 'bg-blue-500', description: 'Currently on a delivery' },
    { value: 'do_not_disturb', label: 'Off Duty', color: 'bg-red-500', description: 'Not accepting assignments' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-500', description: 'Not working' },
];

export const trailerTypeOptions: { value: TrailerType; label: string; description: string; capacity: string }[] = [
    { value: 'open_3car_wedge', label: 'Open 3-Car Wedge', description: 'Standard open auto hauler', capacity: '3 vehicles' },
    { value: 'open_2car', label: 'Open 2-Car', description: 'Small open trailer for 2 vehicles', capacity: '2 vehicles' },
    { value: 'enclosed_2car', label: 'Enclosed 2-Car', description: 'Protected enclosed trailer', capacity: '2 vehicles' },
    { value: 'enclosed_3car', label: 'Enclosed 3-Car', description: 'Larger enclosed trailer', capacity: '3 vehicles' },
    { value: 'flatbed', label: 'Flatbed', description: 'Open flat trailer for heavy/large loads', capacity: '1-2 vehicles' },
    { value: 'hotshot', label: 'Hotshot', description: 'Pickup truck with gooseneck trailer', capacity: '1-3 vehicles' },
    { value: 'dually_flatbed', label: 'Dually Flatbed', description: 'Dually truck with flatbed', capacity: '1-2 vehicles' },
    { value: 'gooseneck', label: 'Gooseneck', description: 'Gooseneck auto trailer', capacity: '2-4 vehicles' },
    { value: 'lowboy', label: 'Lowboy', description: 'Low-profile for tall/heavy machinery', capacity: '1-2 vehicles' },
    { value: 'step_deck', label: 'Step Deck', description: 'Two-level trailer for height clearance', capacity: '1-3 vehicles' },
    { value: '9car_stinger', label: '9-Car Stinger', description: '9-car commercial auto hauler', capacity: '9 vehicles' },
    { value: '7car_stinger', label: '7-Car Stinger', description: '7-car commercial hauler', capacity: '7 vehicles' },
    { value: '5car_open', label: '5-Car Open', description: 'Mid-size open auto hauler', capacity: '5 vehicles' },
    { value: 'rgn', label: 'RGN (Removable Gooseneck)', description: 'For heavy/oversized equipment', capacity: '1 vehicle' },
    { value: 'double_drop', label: 'Double Drop', description: 'For tall, heavy loads', capacity: '1-2 vehicles' },
    { value: 'power_only', label: 'Power Only', description: 'Cab only — pull customer trailer', capacity: 'Varies' },
    { value: 'other', label: 'Other', description: 'Custom or unlisted trailer type', capacity: 'Varies' },
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

export const specialFeatureOptions = [
    { value: 'lift_gate', label: 'Lift Gate' },
    { value: 'winch', label: 'Winch' },
    { value: 'enclosed', label: 'Enclosed' },
    { value: 'air_ride', label: 'Air Ride Suspension' },
    { value: 'gps_tracking', label: 'GPS Tracking' },
    { value: 'eld_equipped', label: 'ELD Equipped' },
    { value: 'hazmat_certified', label: 'HAZMAT Certified' },
    { value: 'oversized_capable', label: 'Oversized Capable' },
    { value: 'inoperable_vehicle_capable', label: 'Inoperable Vehicle Capable' },
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
