import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Layout from './Layout';
import NewCampaign from './pages/NewCampaign';
import Library from './pages/Library';
import Templates from './pages/Templates';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<NewCampaign />} />
            <Route path="library" element={<Library />} />
            <Route path="templates" element={<Templates />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
