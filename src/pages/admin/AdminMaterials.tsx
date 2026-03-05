import React from 'react';
import { PracticalMaterialsAdmin } from '@/components/PracticalMaterialsAdmin';
import { AdminPageLayout } from '@/components/AdminPageLayout';
import { Play } from 'lucide-react';

export default function AdminMaterials() {
  return (
    <AdminPageLayout
      title="Практические материалы"
      description="Управление видео-материалами курса"
      icon={Play}
      iconColor="accent"
    >
      <PracticalMaterialsAdmin />
    </AdminPageLayout>
  );
}
