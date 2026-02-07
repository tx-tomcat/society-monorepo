export const WALLET_EVENTS = {
  BOOST_PAYMENT_COMPLETED: 'boost.payment.completed',
  MEMBERSHIP_PAYMENT_COMPLETED: 'membership.payment.completed',
} as const;

export class BoostPaymentCompletedEvent {
  constructor(public readonly boostId: string) {}
}

export class MembershipPaymentCompletedEvent {
  constructor(public readonly membershipId: string) {}
}
