import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { ThemeProvider } from './components/ThemeProvider';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PortfolioWizard from './pages/PortfolioWizard';
import CVWizard from './pages/CVWizard';
import PublicBlog from './pages/PublicBlog';
import PublicArticle from './pages/PublicArticle';
import DocumentationCenter from './pages/DocumentationCenter';

const ContextAwareChatbot = lazy(() => import('./components/ContextAwareChatbot'));

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/portfolio" component={PortfolioWizard} />
        <Route path="/cv" component={CVWizard} />
        <Route path="/blog" component={PublicBlog} />
        <Route path="/blog/:slug" component={PublicArticle} />
        <Route path="/docs" component={DocumentationCenter} />
        <Route path="/docs/:slug" component={DocumentationCenter} />
        {/* Fallback route */}
        <Route component={HomePage} />
      </Switch>

      {/* Lazy-loaded Hotmart-style Context-Aware Chatbot (appears across pages after auth) */}
      <Suspense fallback={null}>
        <ContextAwareChatbot />
      </Suspense>
    </ThemeProvider>
  );
}

