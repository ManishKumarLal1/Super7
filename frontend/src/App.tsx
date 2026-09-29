import { Routes, Route } from 'react-router-dom';
import { useSmoothScroll } from './animations/useSmoothScroll';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './features/landing/components/Footer';
import { HeroSection } from './features/landing/components/HeroSection';
import { HowItWorksSection } from './features/landing/components/HowItWorksSection';
import { FeatureSection } from './features/landing/components/FeatureSection';
import { CTASection } from './features/landing/components/CTASection';
import { SignInPage } from './pages/SignInPage';
import { ContestsPage } from './pages/ContestsPage';
import { DraftRoom } from './features/draft/DraftRoom';
import { LiveMatchView } from './features/live-match/LiveMatchView';

function App() {
  useSmoothScroll();

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroSection />
              <HowItWorksSection />
              <FeatureSection />
              <CTASection />
            </>
          }
        />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/contests" element={<ContestsPage />} />
        <Route path="/draft/:matchId" element={<DraftRoom />} />
        <Route path="/live-match/:matchId" element={<LiveMatchView />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;