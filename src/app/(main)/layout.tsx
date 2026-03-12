import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastProvider } from '@/context/ToastContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <ToastProvider>
        <div className="min-h-screen bg-white">
          <Header />
          <main className="max-w-lg mx-auto pb-24">{children}</main>
          <BottomNav />
        </div>
      </ToastProvider>
    </NotificationProvider>
  );
}
