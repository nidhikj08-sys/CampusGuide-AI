import AppLayout from "./AppLayout";

export default function AdminLayout({ children, title, subtitle }) {
  return (
    <AppLayout title={title} subtitle={subtitle}>
      {children}
    </AppLayout>
  );
}
