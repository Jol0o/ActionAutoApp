export interface Organization {
    _id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrganizationMember {
    _id: string;
    clerkId: string;
    organizationId: string;
    role: string; // Global system role
    organizationRole: 'admin' | 'member'; // Context-specific role
    email: string;
    fullName: string;
    imageUrl?: string;
    joinedAt: string;
}

export interface OrganizationInvitation {
    _id: string;
    email: string;
    role: 'admin' | 'member';
    token: string;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'expired';
    organizationId: string;
    inviterId: string;
    createdAt: string;
}
