import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import WelcomeCard from '../components/WelcomeCard';
import SearchBar from '../components/SearchBar';
import QuickActions from '../components/QuickActions';
import AssignmentList from '../components/AssignmentList';
import DashboardStats from '../components/DashboardStats';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1">
        <Header />

        <div className="space-y-8 p-10">
          <WelcomeCard />

          <DashboardStats />

          <SearchBar />

          <QuickActions />

          <AssignmentList />
        </div>
      </main>
    </div>
  );
}
