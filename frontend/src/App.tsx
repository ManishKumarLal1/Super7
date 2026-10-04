import { Routes, Route } from 'react-router-dom';
import { useSmoothScroll } from './animations/useSmoothScroll';
import { useMyContests } from './features/contests/myContestsStore';
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
import { WalletPage } from './pages/WalletPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { FriendsPage } from './pages/FriendsPage';
import { ContestWaitingRoom } from './features/contests/components/ContestWaitingRoom';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { HowToPlaySection } from './features/landing/components/HowToPlaySection';
import { PointsDistributionSection } from './features/landing/components/PointsDistributionSection';
import { MyContestsPage } from './pages/MyContestsPage';
import { useLiveMatchEngine } from './features/live-match/useLiveMatchEngine';
import { MatchReportPage } from './pages/MatchReportPage'
import { useFriends } from './features/friends/friendsStore';
import { useChat } from './features/chat/chatStore';
import {useActiveContest, useContestsInit, } from './features/contests/contestsStore';


function App() {
  useSmoothScroll();
  useMyContests();
  useLiveMatchEngine();
  useFriends();
  useChat();
  useContestsInit();
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
              <HowToPlaySection />
              <PointsDistributionSection />
              <CTASection />
            </>
          }
        />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/contests" element={<ContestsPage />} />
        <Route path="/draft/:matchId" element={<DraftRoom />} />
        <Route path="/live-match/:matchId" element={<LiveMatchView />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/contest/:code" element={<ContestWaitingRoom />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route path="/match/:id" element={<MatchDetailPage />} />
        <Route path="/my-contests" element={<MyContestsPage />} />
        <Route path="/report/:entryId" element={<MatchReportPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;