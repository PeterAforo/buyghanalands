"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Loader2, Send, CheckCircle } from "lucide-react";

interface ContactSellerButtonProps {
  sellerId: string;
  sellerName: string;
  listingId: string;
  listingTitle: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ContactSellerButton({
  sellerId,
  sellerName,
  listingId,
  listingTitle,
  className,
  variant = "outline",
  size = "default",
}: ContactSellerButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    
    if (session.user.id === sellerId) {
      return; // Can't message yourself
    }
    
    setIsOpen(true);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: sellerId,
          body: message.trim(),
          listingId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setIsSent(true);
      setTimeout(() => {
        setIsOpen(false);
        setMessage("");
        setIsSent(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  const defaultMessage = `Hi ${sellerName},\n\nI'm interested in your listing "${listingTitle}". Is it still available? I'd like to know more about:\n\n- The exact location\n- Any documents available\n- Negotiation possibilities\n\nPlease let me know when we can discuss further.\n\nThank you!`;

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={className}
        disabled={session?.user?.id === sellerId}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Contact Seller
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message {sellerName}</DialogTitle>
            <DialogDescription>
              Regarding: {listingTitle}
            </DialogDescription>
          </DialogHeader>

          {isSent ? (
            <div className="py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Message Sent!</h3>
              <p className="text-sm text-gray-500 mt-1">
                {sellerName} will be notified of your message.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                value={message || defaultMessage}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={8}
                className="resize-none"
              />

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || isSending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
