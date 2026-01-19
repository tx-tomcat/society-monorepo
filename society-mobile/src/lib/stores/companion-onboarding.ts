import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '../storage';
import { createSelectors } from '../utils';

/**
 * Service type mappings for companion onboarding
 */
export const SERVICE_TYPE_MAP: Record<string, string> = {
  wedding: 'WEDDING_ATTENDANCE',
  tet: 'TET_COMPANIONSHIP',
  family: 'FAMILY_INTRODUCTION',
  corporate: 'BUSINESS_EVENT',
  coffee: 'CASUAL_OUTING',
  social: 'CLASS_REUNION',
} as const;

export type OnboardingStep =
  | 'auth'
  | 'verify-identity'
  | 'create-profile'
  | 'set-services'
  | 'set-pricing'
  | 'set-availability'
  | 'complete';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export interface CompanionOnboardingState {
  // Auth data
  phone: string;
  email: string;
  authMethod: 'phone' | 'email' | null;
  isNewUser: boolean;

  // Profile data
  displayName: string;
  bio: string;
  photos: string[]; // URLs of uploaded photos
  photoFiles: string[]; // Local URIs before upload

  // Services data
  selectedServices: string[]; // occasion IDs

  // Pricing data
  hourlyRate: number;
  minimumHours: number;
  halfDayRate?: number;
  fullDayRate?: number;

  // Availability data
  selectedDays: DayOfWeek[];
  selectedSlots: TimeSlot[];
  advanceNoticeHours: number;

  // Identity verification
  idType: 'vneid' | 'cccd' | 'passport' | null;
  idNumber: string;
  idFrontImage: string;
  idBackImage: string;
  selfieImage: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | null;

  // Navigation
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];

  // Actions
  setAuthData: (data: {
    phone?: string;
    email?: string;
    authMethod: 'phone' | 'email';
    isNewUser?: boolean;
  }) => void;
  setProfileData: (data: {
    displayName?: string;
    bio?: string;
    photos?: string[];
    photoFiles?: string[];
  }) => void;
  setServicesData: (services: string[]) => void;
  setPricingData: (data: {
    hourlyRate: number;
    minimumHours: number;
    halfDayRate?: number;
    fullDayRate?: number;
  }) => void;
  setAvailabilityData: (data: {
    selectedDays: DayOfWeek[];
    selectedSlots: TimeSlot[];
    advanceNoticeHours: number;
  }) => void;
  setVerificationData: (data: {
    idType?: 'vneid' | 'cccd' | 'passport';
    idNumber?: string;
    idFrontImage?: string;
    idBackImage?: string;
    selfieImage?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
  }) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  markStepComplete: (step: OnboardingStep) => void;
  reset: () => void;

  // Computed
  getAvailabilitySlots: () => AvailabilitySlot[];
  getServiceTypes: () => string[];
  verificationData: () => {
    idType: 'vneid' | 'cccd' | 'passport' | null;
    idNumber: string;
    idFrontImage: string;
    idBackImage: string;
    selfieImage: string;
  };
}

const initialState = {
  phone: '',
  email: '',
  authMethod: null as 'phone' | 'email' | null,
  isNewUser: true,
  displayName: '',
  bio: '',
  photos: [],
  photoFiles: [],
  selectedServices: [],
  hourlyRate: 500000,
  minimumHours: 2,
  halfDayRate: undefined,
  fullDayRate: undefined,
  selectedDays: ['sat', 'sun'] as DayOfWeek[],
  selectedSlots: ['afternoon', 'evening'] as TimeSlot[],
  advanceNoticeHours: 24,
  idType: null as 'vneid' | 'cccd' | 'passport' | null,
  idNumber: '',
  idFrontImage: '',
  idBackImage: '',
  selfieImage: '',
  verificationStatus: null as 'pending' | 'verified' | 'rejected' | null,
  currentStep: 'auth' as OnboardingStep,
  completedSteps: [] as OnboardingStep[],
};

const _useCompanionOnboarding = create<CompanionOnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuthData: (data) =>
        set((state) => ({
          phone: data.phone ?? state.phone,
          email: data.email ?? state.email,
          authMethod: data.authMethod,
          isNewUser: data.isNewUser ?? state.isNewUser,
        })),

      setProfileData: (data) =>
        set((state) => ({
          displayName: data.displayName ?? state.displayName,
          bio: data.bio ?? state.bio,
          photos: data.photos ?? state.photos,
          photoFiles: data.photoFiles ?? state.photoFiles,
        })),

      setServicesData: (services) => set({ selectedServices: services }),

      setPricingData: (data) =>
        set({
          hourlyRate: data.hourlyRate,
          minimumHours: data.minimumHours,
          halfDayRate: data.halfDayRate,
          fullDayRate: data.fullDayRate,
        }),

      setAvailabilityData: (data) =>
        set({
          selectedDays: data.selectedDays,
          selectedSlots: data.selectedSlots,
          advanceNoticeHours: data.advanceNoticeHours,
        }),

      setVerificationData: (data) =>
        set((state) => ({
          idType: data.idType ?? state.idType,
          idNumber: data.idNumber ?? state.idNumber,
          idFrontImage: data.idFrontImage ?? state.idFrontImage,
          idBackImage: data.idBackImage ?? state.idBackImage,
          selfieImage: data.selfieImage ?? state.selfieImage,
          verificationStatus:
            data.verificationStatus ?? state.verificationStatus,
        })),

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      reset: () => set(initialState),

      getAvailabilitySlots: () => {
        const state = get();
        const slots: AvailabilitySlot[] = [];

        const dayToNumber: Record<DayOfWeek, number> = {
          sun: 0,
          mon: 1,
          tue: 2,
          wed: 3,
          thu: 4,
          fri: 5,
          sat: 6,
        };

        const slotTimes: Record<TimeSlot, { start: string; end: string }> = {
          morning: { start: '08:00', end: '12:00' },
          afternoon: { start: '12:00', end: '17:00' },
          evening: { start: '17:00', end: '22:00' },
        };

        state.selectedDays.forEach((day) => {
          state.selectedSlots.forEach((slot) => {
            slots.push({
              dayOfWeek: dayToNumber[day],
              startTime: slotTimes[slot].start,
              endTime: slotTimes[slot].end,
              isAvailable: true,
            });
          });
        });

        return slots;
      },

      getServiceTypes: () => {
        const state = get();
        return state.selectedServices
          .map((id) => SERVICE_TYPE_MAP[id])
          .filter(Boolean);
      },

      verificationData: () => {
        const state = get();
        return {
          idType: state.idType,
          idNumber: state.idNumber,
          idFrontImage: state.idFrontImage,
          idBackImage: state.idBackImage,
          selfieImage: state.selfieImage,
        };
      },
    }),
    {
      name: 'companion-onboarding',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          storage.set(name, value);
        },
        removeItem: (name) => {
          storage.delete(name);
        },
      })),
    }
  )
);

export const useCompanionOnboarding = createSelectors(_useCompanionOnboarding);

// Export direct access functions
export const resetCompanionOnboarding = () =>
  _useCompanionOnboarding.getState().reset();
