import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PageLoader from './components/common/PageLoader';
import ProtectedRoute from './components/common/ProtectedRoute';

// Route-level Code Splitting / Lazy Loading for fast initial load
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const About = lazy(() => import('./pages/About'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const FreeTools = lazy(() => import('./pages/FreeTools'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Register = lazy(() => import('./pages/Register'));
const VerifyCallback = lazy(() => import('./pages/VerifyCallback'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/customer/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const SERVICE_SLUGS = [
  'custom-website-development',
  'ui-ux-design',
  'wordpress-development',
  'wix-development',
  'graphic-design',
];

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          {SERVICE_SLUGS.map((slug) => (
            <Route key={slug} path={`/${slug}`} element={<ServiceDetail slug={slug} />} />
          ))}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/about" element={<About />} />
          {/* The dedicated Process page merged into Home's "process-details"
              section — redirect instead of 404ing anyone with the old URL
              bookmarked or indexed. */}
          <Route path="/process" element={<Navigate to="/#process-details" replace />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/tools" element={<FreeTools />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<VerifyCallback />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

