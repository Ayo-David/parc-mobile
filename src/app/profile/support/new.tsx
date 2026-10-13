import { useRouter } from "expo-router";
import { useState } from "react";

import { api } from "@/api/client";
import { ApiError } from "@/api/errors";
import { queryClient } from "@/api/queryClient";
import { Button } from "@/components/Button/Button";
import { FormScreenLayout } from "@/components/FormScreenLayout/FormScreenLayout";
import { TextField } from "@/components/TextField/TextField";

/**
 * Figma "Support 04 — New Ticket" (node 433:126, missing-mobile.md §8).
 * `POST /v1/support/tickets` now sends the real, confirmed
 * `subject`/`description` fields (see `api.createSupportTicket`'s
 * doc comment — the mobile-bff relays this unmodified straight to
 * tenant-admin's internal `createCustomerSupportTicketInternal`, whose
 * schema is fully documented). Figma's "Category" field is dropped
 * rather than built as free text: the real field is `category_id` (a
 * uuid, optional), and no category-list endpoint exists anywhere for the
 * mobile app to source a valid id from — sending arbitrary typed text as
 * a uuid would just fail validation.
 */
export default function NewSupportTicketScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = subject.trim().length >= 3 && message.trim().length >= 3;

  async function handleSend() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createSupportTicket({ subject: subject.trim(), description: message.trim() });
      await queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      router.replace("/profile/support/tickets");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <FormScreenLayout headerTitle="New Ticket" title="New support ticket" errorMessage={error} footer={<Button label="Send message" onPress={handleSend} disabled={!canSubmit} loading={isSubmitting} />}>
        <TextField value={subject} onChangeText={setSubject} placeholder="Subject" autoFocus />
        <TextField value={message} onChangeText={setMessage} placeholder="Tell us what's happening..." multiline numberOfLines={4} />
      </FormScreenLayout>
    </>
  );
}
