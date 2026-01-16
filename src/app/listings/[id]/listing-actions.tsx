"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Share2,
  MessageSquare,
  Phone,
  Loader2,
  X,
  Check,
} from "lucide-react";

interface ListingActionsProps {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string | null;
  priceGhs: string;
  isLoggedIn: boolean;
  isOwnListing: boolean;
  variant: "icons" | "contact" | "offer";
}

export function ListingActions({
  listingId,
  listingTitle,
  sellerId,
  sellerName,
  sellerPhone,
  priceGhs,
  isLoggedIn,
  isOwnListing,
  variant,
}: ListingActionsProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [message, setMessage] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out this land: ${listingTitle}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: listingTitle, text, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    setIsLiked(!isLiked);
    // TODO: Save to favorites API
  };

  const handleContactSeller = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    if (isOwnListing) {
      setError("You cannot message yourself");
      return;
    }
    setShowMessageModal(true);
  };

  const handleRequestCallback = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    if (isOwnListing) {
      setError("This is your own listing");
      return;
    }
    setShowCallbackModal(true);
  };

  const handleMakeOffer = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    if (isOwnListing) {
      setError("You cannot make an offer on your own listing");
      return;
    }
    setOfferAmount(priceGhs);
    setShowOfferModal(true);
  };

  const submitMessage = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: sellerId,
          listingId,
          content: message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess("Message sent successfully!");
      setMessage("");
      setTimeout(() => {
        setShowMessageModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOffer = async () => {
    if (!offerAmount) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amountGhs: parseFloat(offerAmount),
          message: offerMessage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit offer");
      }

      setSuccess("Offer submitted successfully!");
      setTimeout(() => {
        setShowOfferModal(false);
        setSuccess(null);
        router.push("/dashboard/offers");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCallbackRequest = async () => {
    if (!callbackPhone) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Send as a message with callback request
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: sellerId,
          listingId,
          content: `📞 Callback Request\n\nPhone: ${callbackPhone}\nPreferred Time: ${callbackTime || "Anytime"}\n\nRegarding: ${listingTitle}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess("Callback request sent!");
      setCallbackPhone("");
      setCallbackTime("");
      setTimeout(() => {
        setShowCallbackModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Icons variant (for image overlay)
  if (variant === "icons") {
    return (
      <>
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleLike}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Share2 className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </>
    );
  }

  // Contact variant (for seller card)
  if (variant === "contact") {
    return (
      <>
        <div className="space-y-2">
          <Button className="w-full" onClick={handleContactSeller} disabled={isOwnListing}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Seller
          </Button>
          <Button variant="outline" className="w-full" onClick={handleRequestCallback} disabled={isOwnListing}>
            <Phone className="h-4 w-4 mr-2" />
            Request Call Back
          </Button>
        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <Modal onClose={() => setShowMessageModal(false)} title={`Message ${sellerName}`}>
            {success ? (
              <div className="text-center py-4">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600">{success}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Send a message about: <strong>{listingTitle}</strong>
                </p>
                <Textarea
                  placeholder="Hi, I'm interested in this property..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowMessageModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={submitMessage} disabled={isSubmitting || !message.trim()} className="flex-1">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Message"}
                  </Button>
                </div>
              </>
            )}
          </Modal>
        )}

        {/* Callback Modal */}
        {showCallbackModal && (
          <Modal onClose={() => setShowCallbackModal(false)} title="Request Call Back">
            {success ? (
              <div className="text-center py-4">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600">{success}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Request a call from {sellerName} about this property.
                </p>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Your Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="0XX XXX XXXX"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Time (optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g., Weekdays after 5pm"
                      value={callbackTime}
                      onChange={(e) => setCallbackTime(e.target.value)}
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCallbackModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={submitCallbackRequest} disabled={isSubmitting || !callbackPhone} className="flex-1">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Call"}
                  </Button>
                </div>
              </>
            )}
          </Modal>
        )}

        {error && !showMessageModal && !showCallbackModal && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </>
    );
  }

  // Offer variant
  if (variant === "offer") {
    return (
      <>
        <Button className="w-full" size="lg" onClick={handleMakeOffer} disabled={isOwnListing}>
          Make an Offer
        </Button>

        {/* Offer Modal */}
        {showOfferModal && (
          <Modal onClose={() => setShowOfferModal(false)} title="Make an Offer">
            {success ? (
              <div className="text-center py-4">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600">{success}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Make an offer on: <strong>{listingTitle}</strong>
                </p>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Your Offer (GH₵)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Asking price: GH₵{parseInt(priceGhs).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message (optional)</label>
                    <Textarea
                      placeholder="Add a message to your offer..."
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowOfferModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={submitOffer} disabled={isSubmitting || !offerAmount} className="flex-1">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Offer"}
                  </Button>
                </div>
              </>
            )}
          </Modal>
        )}

        {error && !showOfferModal && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </>
    );
  }

  return null;
}

// Simple Modal component
function Modal({ 
  children, 
  onClose, 
  title 
}: { 
  children: React.ReactNode; 
  onClose: () => void; 
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
