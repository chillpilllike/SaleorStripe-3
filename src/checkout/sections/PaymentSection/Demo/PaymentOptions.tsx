import { Button } from "@/checkout/components";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";
import { loadStripe } from '@stripe/stripe-js';
import { useCheckoutPaymentCreateMutation } from './CheckoutPaymentMutation.ts';
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useCheckoutComplete } from "@/checkout/hooks/useCheckoutComplete";
import { useCheckoutCompleteMutation } from './checkoutCompleteMutatio.ts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import default CSS
import './index.css'


export const DemoPayment = () => {

  
  const { checkout } = useCheckout();

  const [{ data: completeData, error: completeError, fetching: completeFetching }, checkoutComplete] = useCheckoutCompleteMutation();
  const { totalprice } = useStore();
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [bloading, setbLoading] = useState<boolean>(false);
  const [client_secret, setClientSecret] = useState<string>('');
  const router = useRouter();
  const [currency, setCurrency] = useState("usd");

  const payButtonRef = useRef<HTMLButtonElement | null>(null); // Ref for submit button

  useEffect(() => {
    if (paymentLink !== null) router.push(paymentLink);
  }, [paymentLink]);
  const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();
  const [{ data, error, fetching }, checkoutPaymentCreate] = useCheckoutPaymentCreateMutation();

  // Initialize Stripe
  useEffect(() => {
    if (client_secret) {
      const initializeStripe = async () => {
        try {
          const stripe = await loadStripe(
            "pk_test_51QSCgsGY6Eq0PDfPlTMPgFueeHaKFpOFk8ZogQX63SILRr2qavuolYa0lWlfptTtdixDTmVQFGra2IZ3PB59Jh8B006XCs4xbr"
          );
      
          const elements = stripe.elements({ clientSecret:client_secret });
      
          // Create the PaymentElement
          const paymentElement = elements.create("payment",{ layout: 'accordion'});
          paymentElement.mount("#card-element");
      
          // Attach click listener to the button
          if (payButtonRef.current) {
            payButtonRef.current.addEventListener("click", async () => {
              setLoading(true);
              setbLoading(true);
              try {
                const { error } = await stripe.confirmPayment({
                  elements,
                  redirect: 'if_required', 
                });
      
                if (error) {
                  console.log("Payment failed:", error);
                  toast.error(error.message);
                
                  // Reload the page after 3 seconds
                  setTimeout(() => {
                    window.location.reload();
                  }, 3000); // 3000ms = 3 seconds
                 // setbLoading(false)
                  
                } else {
                  console.log("Payment succeeded!");
                  void onCheckoutComplete();
                }
              } catch (err) {
                console.log("Error confirming payment:", err);
                alert("Something went wrong while processing the payment.");
              } finally {
                setLoading(false);
               
              }
            });
          }
        } catch (error) {
          console.log("Error initializing Stripe:", error);
          alert("Failed to initialize Stripe. Please try again.");
        }
      };
      
      // Call the initializeStripe function
      initializeStripe();
      
    }
  }, [client_secret]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const variables = {
        checkoutId: checkout.id,
        amount: totalprice,
        gateway: "saleor.payments.stripe",
      };

      const response = await checkoutPaymentCreate(variables);

      if (response?.data?.checkoutPaymentCreate?.errors?.length) {
        throw new Error(response.data.checkoutPaymentCreate.errors[0].message);
      }

      if (response.data.checkoutPaymentCreate.payment.id) {
        const checkoutCompleteResponse = await checkoutComplete({
          checkoutId: checkout.id,
        });

        if (checkoutCompleteResponse.data) {
          const details = JSON.parse(checkoutCompleteResponse.data?.checkoutComplete?.confirmationData);
          console.log(details.client_secret)
          setLoading(false);
          setClientSecret(details?.client_secret);
        }
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      if (err === 'Shipping method is not set') {
        alert("please select shiping method its in default ")
      }
      setLoading(false);
    }
  };

  return (
    <div>
    {bloading ?
    <div className="loader"/>:
    (<>
   <div id="card-element" style={{ display: bloading ? 'none' : 'block' }}></div>
      {client_secret ?
        <>

          <button ref={payButtonRef} className="pay-nw" disabled={loading}>Pay Now</button></> :
        (<>
          <button onClick={handleSubmit} disabled={loading}>
            <Button label={loading ? "Processing..." : "Checkout"} />
          </button>


          <select
            className="ml-2 h-10 w-fit rounded-md border border-neutral-300 bg-transparent bg-white px-4 py-2 pr-10 text-sm placeholder:text-neutral-500 focus:border-black focus:ring-black"
            onChange={(e) => setCurrency(e.target.value)}
            value={currency}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="AUD">AUD</option>
            <option value="GBP">GBP</option>
          </select></>)

      }

    </>)
    
    }
      
    </div>
  );
};
