import { cookies } from "next/headers";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchCommand } from "@/components/search-command";
import { Notifications } from "@/components/notifications";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen} suppressHydrationWarning>
        <AppSidebar />
        <main className="flex-1">
          <header className="flex h-12 items-center gap-2 border-b bg-sidebar px-2 sm:px-4">
            <SidebarTrigger />
            <DynamicBreadcrumb />
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <Notifications />
              <SearchCommand />
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl pt-2 sm:pt-4">{children}</div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
