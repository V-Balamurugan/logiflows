import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrganizationMembership } from '../types/organization';
import { getMyMembershipsApi } from '../api/organizationApi';
import { useAuth } from './AuthContext';

interface TenantContextType {
  memberships: OrganizationMembership[];
  currentMembership: OrganizationMembership | null;
  currentOrganizationId: string | null;
  isLoading: boolean;
  switchOrganization: (orgId: string) => void;
  refreshMemberships: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [currentMembership, setCurrentMembership] = useState<OrganizationMembership | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchMemberships = async () => {
    if (!isAuthenticated) {
      setMemberships([]);
      setCurrentMembership(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getMyMembershipsApi();
      setMemberships(data);

      // Auto-select first active membership if none selected or current is invalid
      if (data.length > 0) {
        const activeMemberships = data.filter((m) => m.is_active);
        const validDefault = activeMemberships.length > 0 ? activeMemberships[0] : data[0];
        setCurrentMembership((prev) => {
          if (prev && data.some((m) => m.organization === prev.organization)) {
            return data.find((m) => m.organization === prev.organization) || validDefault;
          }
          return validDefault;
        });
      } else {
        setCurrentMembership(null);
      }
    } catch (err) {
      console.error('Failed to load user tenant memberships:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [isAuthenticated, user?.id]);

  const switchOrganization = (orgId: string) => {
    const target = memberships.find((m) => m.organization === orgId);
    if (target) {
      setCurrentMembership(target);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        memberships,
        currentMembership,
        currentOrganizationId: currentMembership?.organization || null,
        isLoading,
        switchOrganization,
        refreshMemberships: fetchMemberships,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

