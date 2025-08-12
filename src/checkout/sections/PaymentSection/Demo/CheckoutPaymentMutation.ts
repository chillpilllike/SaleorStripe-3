import { gql } from '@urql/core';
import { useMutation } from 'urql';

// Updated mutation with the 'gateway' field as a String
const CheckoutPaymentCreateDocument = gql`
  mutation checkoutPaymentCreate($checkoutId: ID!, $amount: PositiveDecimal!, $gateway: String!) {
    checkoutPaymentCreate(checkoutId: $checkoutId, input: { amount: $amount, gateway: $gateway }) {
      payment {
        id
        chargeStatus
      }
      errors {
        field
        message
      }
    }
  }
`;

export function useCheckoutPaymentCreateMutation() {
  return useMutation(CheckoutPaymentCreateDocument);
}
