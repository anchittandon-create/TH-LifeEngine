"use client";

import { useState } from "react";
import { PageHeader } from "./PageHeader";
import { Button } from "@/components/ui/Button";
import { ProfilesView } from "./ProfilesView";
import { NewProfileModal } from "./NewProfileModal";
import type { Profile } from "@/lib/types/profile";

export function ProfilesPageClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const handleOpen = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);

  const handleEdit = (_profile: Profile) => {
    // placeholder for Phase 2
    setModalOpen(true);
  };

  const handleDelete = (_profile: Profile) => {
    // deletion workflow will be implemented in upcoming phases
    alert("Delete flow will be available soon.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member profiles"
        description="Manage member demographics, health context, and contact preferences. These profiles power every personalised plan."
        action={
          <Button variant="primary" onClick={handleOpen}>
            New profile
          </Button>
        }
      />

      <ProfilesView onCreate={handleOpen} onEdit={handleEdit} onDelete={handleDelete} />
      <NewProfileModal open={modalOpen} onClose={handleClose} />
    </div>
  );
}
