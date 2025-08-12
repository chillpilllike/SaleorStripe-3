import { gql } from '@urql/core';
import { useMutation } from 'urql';

// Define the GraphQL mutation for completing the checkout
const CheckoutCompleteDocument = gql`
  mutation checkoutComplete($checkoutId: ID!) {
    checkoutComplete(checkoutId: $checkoutId) {
      order {
        id
        userEmail
        created
      }
      confirmationNeeded
      confirmationData
      errors {
        field
        message
        code
      }
    }
  }
`;

export function useCheckoutCompleteMutation() {
  return useMutation(CheckoutCompleteDocument);
}
