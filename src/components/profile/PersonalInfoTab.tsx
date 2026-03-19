import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    UserCog,
    Edit3,
    Check,
    Phone,
    MapPin,
    Calendar,
    User,
    Briefcase,
    Building2,
    Clock,
    Globe,
    Link2,
    Plus,
    X,
    Loader2
} from 'lucide-react';
import { PersonalInfo, SocialLink } from '@/types/user';
import { cn } from '@/lib/utils';
import { countryCodes, timezoneOptions, languageOptions } from './profile-constants';

interface PersonalInfoTabProps {
    personalInfo: PersonalInfo;
    editingPersonalInfo: boolean;
    isSaving: boolean;
    phoneCountryCode: string;
    socialLinks: SocialLink[];
    bioError: string;
    setEditingPersonalInfo: (editing: boolean) => void;
    setPersonalInfo: (info: PersonalInfo) => void;
    setPhoneCountryCode: (code: string) => void;
    setSocialLinks: (links: SocialLink[]) => void;
    handleBioChange: (value: string) => void;
    setShowSaveConfirmDialog: (show: boolean) => void;
    addSocialLink: () => void;
    updateSocialLink: (index: number, field: 'label' | 'url', value: string) => void;
    removeSocialLink: (index: number) => void;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
    personalInfo,
    editingPersonalInfo,
    isSaving,
    phoneCountryCode,
    socialLinks,
    bioError,
    setEditingPersonalInfo,
    setPersonalInfo,
    setPhoneCountryCode,
    setSocialLinks,
    handleBioChange,
    setShowSaveConfirmDialog,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
}) => {
    return (
        <Card className="p-0 shadow-xl border border-green-100 dark:border-green-900 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-cyan-500 to-teal-500 animate-gradient"></div>
            <CardHeader className="py-3 sm:py-4 bg-linear-to-br from-green-50 to-emerald-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-green-100 dark:border-green-900">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 animate-slide-in-left">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <UserCog className="size-5 sm:size-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg sm:text-xl">Personal Information</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Manage your personal details</CardDescription>
                        </div>
                    </div>
                    {!editingPersonalInfo ? (
                        <Button onClick={() => setEditingPersonalInfo(true)} className="hover-lift">
                            <Edit3 className="size-4 mr-2" />Edit
                        </Button>
                    ) : (
                        <div className="flex gap-2 animate-slide-in-right">
                            <Button variant="outline" onClick={() => setEditingPersonalInfo(false)} className="transition-all hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</Button>
                            <Button onClick={() => setShowSaveConfirmDialog(true)} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 transition-all hover-lift">
                                {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />}
                                Save
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up">
                    <div className="md:col-span-2 space-y-3 animate-slide-up stagger-1">
                        <Label htmlFor="bio" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <Edit3 className="size-4 text-emerald-600" />Bio / Description
                        </Label>
                        <Textarea
                            id="bio"
                            value={personalInfo.bio || ''}
                            onChange={(e) => handleBioChange(e.target.value)}
                            disabled={!editingPersonalInfo}
                            placeholder="Tell us about yourself..."
                            className="min-h-30 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors duration-200 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium resize-none"
                            maxLength={500}
                        />
                        <div className="flex justify-between items-center">
                            <span className={cn("text-xs font-medium transition-colors", bioError ? "text-red-500" : "text-gray-500")}>
                                {bioError || `${(personalInfo.bio?.length || 0)}/500 characters`}
                            </span>
                            {(personalInfo.bio?.length || 0) > 450 && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold animate-soft-pulse">{500 - (personalInfo.bio?.length || 0)} remaining</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-2">
                        <Label htmlFor="phone" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <Phone className="size-4 text-emerald-600" />Phone Number
                        </Label>
                        <div className="flex gap-2">
                            <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode} disabled={!editingPersonalInfo}>
                                <SelectTrigger className="w-35 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300">
                                    <SelectValue placeholder="Code" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countryCodes.map((cc) => (
                                        <SelectItem key={cc.code} value={cc.code}>
                                            {cc.code} - {cc.country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="phone"
                                value={personalInfo.phone || ''}
                                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                disabled={!editingPersonalInfo}
                                placeholder="(555) 123-4567"
                                className="flex-1 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-3">
                        <Label htmlFor="location" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <MapPin className="size-4 text-emerald-600" />Location
                        </Label>
                        <Input id="location" value={personalInfo.location || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} disabled={!editingPersonalInfo} placeholder="City, State"
                            className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                        />
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-4">
                        <Label htmlFor="dateOfBirth" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <Calendar className="size-4 text-emerald-600" />Date of Birth
                        </Label>
                        <Input
                            id="dateOfBirth"
                            type="date"
                            value={personalInfo.dateOfBirth || ''}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                            disabled={!editingPersonalInfo}
                            className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                        />
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-5">
                        <Label htmlFor="gender" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <User className="size-4 text-emerald-600" />Gender
                        </Label>
                        <Select value={personalInfo.gender || ''} onValueChange={(value) => setPersonalInfo({ ...personalInfo, gender: value })} disabled={!editingPersonalInfo}>
                            <SelectTrigger className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300"><SelectValue placeholder="Select gender" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-1">
                        <Label htmlFor="jobTitle" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <Briefcase className="size-4 text-emerald-600" />Job Title
                        </Label>
                        <Input id="jobTitle" value={personalInfo.jobTitle || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })} disabled={!editingPersonalInfo} placeholder="Sales Manager"
                            className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                        />
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-2">
                        <Label htmlFor="department" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <Building2 className="size-4 text-emerald-600" />Department
                        </Label>
                        <Input id="department" value={personalInfo.department || ''} onChange={(e) => setPersonalInfo({ ...personalInfo, department: e.target.value })} disabled={!editingPersonalInfo} placeholder="Sales"
                            className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 font-medium p-3"
                        />
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-3">
                        <Label htmlFor="timezone" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <Clock className="size-4 text-emerald-600" />Timezone
                        </Label>
                        <Select value={personalInfo.timezone || ''} onValueChange={(value) => setPersonalInfo({ ...personalInfo, timezone: value })} disabled={!editingPersonalInfo}>
                            <SelectTrigger className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                            <SelectContent>
                                {timezoneOptions.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        <span className="font-medium">{tz.abbr}</span>
                                        <span className="text-gray-500 text-xs ml-2">- {tz.label.split('(')[1]?.replace(')', '') || tz.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 animate-slide-up stagger-4">
                        <Label htmlFor="language" className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                            <Globe className="size-4 text-emerald-600" />Language
                        </Label>
                        <Select value={personalInfo.language || ''} onValueChange={(value) => setPersonalInfo({ ...personalInfo, language: value })} disabled={!editingPersonalInfo}>
                            <SelectTrigger className="rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors hover:border-gray-300"><SelectValue placeholder="Select language" /></SelectTrigger>
                            <SelectContent>
                                {languageOptions.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Social Links Section */}
                    <div className="md:col-span-2 space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700 animate-slide-up stagger-5">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                                <Link2 className="size-4 text-emerald-600" />Additional Links ({socialLinks.length}/4)
                            </Label>
                            {editingPersonalInfo && socialLinks.length < 4 && (
                                <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="hover-lift transition-all">
                                    <Plus className="mr-1 size-3" /> Add Link
                                </Button>
                            )}
                        </div>
                        {socialLinks.length === 0 ? (
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No additional links added. Click "Add Link" to add up to 4 links.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {socialLinks.map((link, index) => (
                                    <div key={index} className="flex gap-2 items-start animate-smooth-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                value={link.label}
                                                onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                                                disabled={!editingPersonalInfo}
                                                placeholder="Label (e.g., Twitter, GitHub)"
                                                className="text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 p-3"
                                            />
                                            <Input
                                                value={link.url}
                                                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                                disabled={!editingPersonalInfo}
                                                placeholder="https://..."
                                                className="text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 disabled:bg-gray-50 dark:disabled:bg-gray-900 p-3"
                                            />
                                        </div>
                                        {editingPersonalInfo && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeSocialLink(index)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
