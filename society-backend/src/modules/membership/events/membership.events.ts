export const MEMBERSHIP_EVENTS = {
  MEMBERSHIP_PAYMENT_COMPLETED: 'membership.payment.completed',
} as const;

export class MembershipPaymentCompletedEvent {
  constructor(public readonly membershipId: string) {}
}
