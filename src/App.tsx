import { useState } from "react";
import { INITIAL_STATE } from "./data";
import type { AppState, Application, Role } from "./types";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import HandoverForm from "./pages/HandoverForm";
import MyApplications from "./pages/MyApplications";
import Review from "./pages/Review";
import ApplicationDetail from "./pages/ApplicationDetail";
import Reports from "./pages/Reports";
import MasterData from "./pages/MasterData";
import ActionItems from "./pages/ActionItems";
import Documents from "./pages/Documents";
import AIAssistant from "./components/AIAssistant";

export type Page =
  | "dashboard"
  | "handover-form"
  | "my-applications"
  | "review"
  | "app-detail"
  | "reports"
  | "master-data"
  | "action-items"
  | "documents";

interface CurrentUser {
  name: string;
  role: Role;
  email: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);

  function updateApp(id: string, updates: Partial<Application>) {
    setAppState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    }));
  }

  function addApp(app: Application) {
    setAppState((prev) => ({
      ...prev,
      applications: [app, ...prev.applications],
    }));
  }

  function updateState(updates: Partial<AppState>) {
    setAppState((prev) => ({ ...prev, ...updates }));
  }

  function navigate(page: Page, appId?: string) {
    setCurrentPage(page);
    if (appId) setSelectedAppId(appId);
  }

  function handleLogin(role: Role, name: string) {
    const user = appState.users.find((u) => u.name === name);
    setCurrentPage("dashboard");
    const email = user ? user.email : "user@energi.co.id";
    setCurrentUser({ name, role, email });
  }

  function handleLogout() {
    setCurrentUser(null);
    setCurrentPage("dashboard");
    setSelectedAppId(null);
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const selectedApp = selectedAppId
    ? (appState.applications.find((a) => a.id === selectedAppId) ?? null)
    : null;

  function renderPage() {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
          />
        );
      case "handover-form":
        return (
          <HandoverForm
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
            onAddApp={addApp}
          />
        );
      case "my-applications":
        return (
          <MyApplications
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
          />
        );
      case "review":
        return (
          <Review
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
            onUpdateApp={updateApp}
          />
        );
      case "app-detail":
        return selectedApp ? (
          <ApplicationDetail
            app={selectedApp}
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
            onUpdateApp={updateApp}
          />
        ) : (
          <MyApplications
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
          />
        );
      case "reports":
        return <Reports appState={appState} currentUser={currentUser!} />;
      case "master-data":
        return <MasterData appState={appState} onUpdateState={updateState} />;
      case "action-items":
        return (
          <ActionItems
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
          />
        );
      case "documents":
        return (
          <Documents
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
          />
        );
      default:
        return (
          <Dashboard
            appState={appState}
            currentUser={currentUser!}
            onNavigate={navigate}
          />
        );
    }
  }

  return (
    <div style={{ height: "100vh", background: "#f0f4f8" }}>
      <Layout
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
      <AIAssistant
        appState={appState}
        currentUser={currentUser}
        onNavigate={navigate}
      />
    </div>
  );
}
