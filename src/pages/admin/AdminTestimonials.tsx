import * as React from "react";
import { MessageCircle } from "lucide-react";

import { AdminPageLayout } from "@/components/AdminPageLayout";
import { TestimonialsAdmin } from "@/components/TestimonialsAdmin";

export default function AdminTestimonials() {
  return (
    <AdminPageLayout
      title="Отзывы"
      description="Управление отзывами для главной страницы и кабинета студента"
      icon={MessageCircle}
      iconColor="primary"
    >
      <TestimonialsAdmin />
    </AdminPageLayout>
  );
}
