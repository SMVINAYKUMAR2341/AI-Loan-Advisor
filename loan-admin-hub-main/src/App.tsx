import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LoanApplications from "./pages/LoanApplications";
import LoanDisbursement from "./pages/LoanDisbursement";
import EMITracking from "./pages/EMITracking";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import AdminProfile from "./pages/AdminProfile";
import Tickets from "./pages/Tickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/loans" element={<LoanApplications />} />
          <Route path="/disbursement" element={<LoanDisbursement />} />
          <Route path="/emi" element={<EMITracking />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<AdminProfile />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
