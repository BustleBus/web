import Dashboard from "./components/Dashboard";
import DashboardNoVirt from "./components/DashboardNoVirt";

function App() {
  const isNoVirt = window.location.pathname === '/no-virt' || window.location.search.includes('no-virt');

  return (
    <main>
      {isNoVirt ? <DashboardNoVirt /> : <Dashboard />}
    </main>
  );
}

export default App;
